const fetch = require('cross-fetch')
const Web3 = require('web3')
const fs = require('fs');


const StakeWeight=1
const ConsumeWeight=1


async function getValidDids(chainId){
    let goodDids=[]
    //load a file until this repo is public and we can access https://github.com/oceanprotocol/datafarming/blob/main/datafarms-list.json
    let rawdata = fs.readFileSync('dids.json');
    let dids = JSON.parse(rawdata);
    for(did of dids){
        if(did.chainId==chainId)
            goodDids.push(did.did)
    }
    return(goodDids)

}


let shares=[]

// get all shares for a did
async function getShares(did,subgraphURL,startBlock,endBlock,chunkSize){
    //get pool id first
    const dtAddress=did.slice(7).toLowerCase()
    const poolQuery={
        query: `query Pool {
            pools(where: { datatokenAddress: "0x${dtAddress}"}) {
              id
              spotPrice
              consumePrice
              datatokenAddress
              datatokenReserve
              oceanReserve
            }
          }`
    }
    let shares=[]
    const response = await fetch(subgraphURL, {
        method: 'POST',
        body: JSON.stringify(poolQuery)
      })
      const result = await response.json()
      if(result.data.pools){
          shares=await getPoolShares(result.data.pools[0].id,subgraphURL,startBlock,endBlock,chunkSize)
      }
    return shares
    }


    async function getPoolSharesatBlock(id,subgraphURL,block){
        let shares=[]
            const query = {
                query: `query actorshares{
                    pools(
                      skip:0,
                      where: { id: "${id}"}
                      block:{number:${block}}
                    )
                     {
                      id
                      tokens{balance,tokenAddress},
                      totalShares
                      shares{
                        userAddress {
                          id
                        }
                        balance
                      }
                    }
                    }`
              }
              
              const response = await fetch(subgraphURL, {
                method: 'POST',
                body: JSON.stringify(query)
              })
              const result = await response.json()
              for(pool of result.data.pools){
                  for(share of pool.shares){
                    if(share.balance)
                        shares[share.userAddress.id]=parseFloat(share.balance)
                  }
              }     
              return(shares)     
        }

    
async function getPoolShares(id,subgraphURL,startBlock,endBlock,chunkSize){
    let shares=[]
    let count=0
    let i
    for(i=parseInt(startBlock);i<=parseInt(endBlock);i=i+parseInt(chunkSize)){
        count++
        const blockShares=await getPoolSharesatBlock(id,subgraphURL,i)
        for(share in blockShares){
            //just divide them
            if(!shares.includes[share])
                shares[share]=0
            shares[share]+=parseFloat(blockShares[share])
        }        
    }
    if(i<endBlock){
        //do it for endBlock as well
        count++
        const blockShares=await getPoolSharesatBlock(id,subgraphURL,endBlock)
        for(share in blockShares){
            //just divide them
            if(!shares.includes[share])
                shares[share]=0
            shares[share]+=parseFloat(blockShares[share])
        }
    }
    for(share in shares){
        //just do a simple average 
        shares[share]=shares[share]/count
    }
    return(shares)
}


async function getConsumes(did,subgraphURL,startTimestamp,endBlockTimestamp){
    const dtAddress=did.slice(7).toLowerCase()
        const query = {
            query: `query consumes{
                tokenOrders(
                  where: {timestamp_gte:${startTimestamp} ,timestamp_lte:${endBlockTimestamp}, datatokenId:"0x${dtAddress}"}
                )
                {
                  datatokenId {
                    id
                  }
                  timestamp
                }
                      
                    }`
          }
          const response = await fetch(subgraphURL, {
            method: 'POST',
            body: JSON.stringify(query)
          })
          const result = await response.json()
          return(result.data.tokenOrders.length)
          
    }

async function calculate(){
    /* Flow is simple.
    For each valid did:
          1. get pools for that dt
          2. get snapshots of shares from startBlock to endBlock, from chunk to chunk
          3. compute average share  (sum all shares from 2 and dividem them by nr of snapshots)
          4. get consume count
          5. compute reward
    */
    const args = process.argv.slice(2)
    const rpcURL = args[0]
    const startBlockNo = args[1]
    const endBlockNo = args[2]
    const chunkSize = args[3]
    if(!rpcURL || !startBlockNo || !endBlockNo || !chunkSize){
        console.error("Missing required params.  Syntax:  node ./index.js RPC_URL startBlock endBlock chunkSize")
        process.exit(1)
    }
    const web3 = new Web3(rpcURL)
    const chainId = await web3.eth.getChainId()
    let subgraphURL
    switch(chainId){
        case 1: subgraphURL = 'https://subgraph.mainnet.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph';break
        default: subgraphURL=null; break
    }
    console.error(subgraphURL)
    if(!subgraphURL){
        console.error("Invalid chainId")
        process.exit(1)
    }
    const dids=await getValidDids(chainId)
    const startBlock = await web3.eth.getBlock(startBlockNo)
    const startBlockTimestamp = startBlock.timestamp
    const endBlock = await web3.eth.getBlock(endBlockNo)
    const endBlockTimestamp = endBlock.timestamp

    let rewards=[]
    for(did of dids){
        console.log("Computing did "+did)
        const didShares = await getShares(did,subgraphURL,startBlockNo,endBlockNo,chunkSize)
        const consumes = await getConsumes(did,subgraphURL,startBlockTimestamp,endBlockTimestamp)
        //we have shares & consume nr..  let's calculate rewards
        for(share in didShares){
            if(!rewards.includes[share])
                rewards[share]=0
            rewards[share]=rewards[share]+Math.log10(didShares[share]+1)*StakeWeight*Math.log10(consumes+2)*ConsumeWeight
        }
    }
    //write rewards to csv
    const filename='rewards_'+chainId+"_"+startBlockNo+"_"+endBlockNo+".csv"
    console.log("Writing results to "+filename)
    const writeStream = fs.createWriteStream(filename)
    for(reward in rewards){
        writeStream.write(reward+","+rewards[reward]+"\n")              
    }
        
}



calculate()