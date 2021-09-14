const fetch = require('cross-fetch')
const Web3 = require('web3')
const fs = require('fs');
const Decimal = require ('decimal.js');
const { config } = require('process');
const OceanReward = 50000
const StakeWeight = 1
const ConsumeWeight = 1
const debug=true

async function getValidDids(chainId, filename) {
    let goodDids = []
    //load a file until this repo is public and we can access https://github.com/oceanprotocol/datafarming/blob/main/datafarms-list.json
    let rawdata = fs.readFileSync(filename);
    let dids = JSON.parse(rawdata);
    for (did of dids) {
        if (did.chainId == chainId)
            goodDids.push(did.did)
    }
    return (goodDids)

}


let shares = []

// get all shares for a did
async function getShares(did, subgraphURL, startBlock, endBlock, chunkSize) {
    //get pool id first
    const dtAddress = did.slice(7).toLowerCase()
    const poolQuery = {
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
    let shares = []
    const response = await fetch(subgraphURL, {
        method: 'POST',
        body: JSON.stringify(poolQuery)
    })
    const result = await response.json()
    if (result.data.pools) {
        shares = await getPoolShares(result.data.pools[0].id, subgraphURL, startBlock, endBlock, chunkSize)
    }
    return shares
}

async function getDTPriceFromPool(dtAddress, subgraphURL, block) {
    let price = null
    const query = {
        query: `query dtprice{
            pools(skip:0,
                where: { datatokenAddress: "0x${dtAddress}"}
                block:{number:${block}}) {
              id
              consumePrice
              datatokenReserve
              oceanReserve
              spotPrice
              swapFee
              transactionCount
            }
          }
        `
    }

    const response = await fetch(subgraphURL, {
        method: 'POST',
        body: JSON.stringify(query)
    })
    const result = await response.json()
    if(result.data.pools)
        return result.data.pools[0].spotPrice
    else
        return (0)
}
async function getPoolSharesatBlock(id, subgraphURL, block) {
    let shares = []
    console.log("Getting shares for pool "+id+" at block "+block)
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
    for (pool of result.data.pools) {
        const totalShares=pool.totalShares
        for (share of pool.shares) {
            if (share.balance)
                shares[share.userAddress.id] = new Decimal(share.balance).div(totalShares)
        }
    }
    return (shares)
}


async function getPoolShares(id, subgraphURL, startBlock, endBlock, chunkSize) {
    let shares = []
    let count = 0
    let i
    for (i = parseInt(startBlock); i <= parseInt(endBlock); i = i + parseInt(chunkSize)) {
        count++
        const blockShares = await getPoolSharesatBlock(id, subgraphURL, i)
        for (share in blockShares) {
            if (!shares.includes[share])
                shares[share] = new Decimal(0)
            shares[share]=shares[share].plus(blockShares[share])
        }
    }
    if (i < endBlock) {
        //do it for endBlock as well
        count++
        const blockShares = await getPoolSharesatBlock(id, subgraphURL, endBlock)
        for (share in blockShares) {
            if (!shares.includes[share])
                shares[share] = new Decimal(0)
            shares[share]=shares[share].plus(blockShares[share])
        }
    }
    for (share in shares) {
        //just do a simple average 
        shares[share] = new Decimal(shares[share]).div(count)
        
    }
    return (shares)
}

/* Returns totalConsume for a datatoken (expressed in Ocean tokens) in a specific interval
    Gets every consume from the graph, and for each one take the block no and finds the spotPrice of that pool at that block time
*/
async function getConsumes(did, subgraphURL, startTimestamp, endTimestamp) {
    let totalConsume = 0
    const dtAddress = did.slice(7).toLowerCase()
    const query = {
        query: `query consumes{
                tokenOrders(
                  where: {timestamp_gte:${startTimestamp} ,timestamp_lte:${endTimestamp}, datatokenId:"0x${dtAddress}"}
                )
                {
                  datatokenId {
                    id
                  }
                  timestamp,
                  block
                }
                    }`
    }
    const response = await fetch(subgraphURL, {
        method: 'POST',
        body: JSON.stringify(query)
    })
    const result = await response.json()
    let count = 0
    for (consumes of result.data.tokenOrders) {
        const price = await getDTPriceFromPool(dtAddress,subgraphURL,consumes.block)
        totalConsume += parseFloat(price)
        count ++
    }
    console.info("Total consumes for did:"+did+" :"+totalConsume+" ("+count+" consumes)")
    return (totalConsume)

}

async function calculate() {
    /* Flow is simple.
    For each chain
        For each did that matches the chainId:
            1. get pools for that did
            2. get snapshots of shares from startBlock to endBlock, from chunk to chunk
            3. compute average share  (sum all shares from step 2 and dividem them by nr of snapshots)
            4. get consume count
            5. compute reward
            6. add reward for did to global rewards
    Write rewards to csv
    */

    const args = process.argv.slice(2)
    if (!args[0] || !args[1]) {
        console.error("Missing required params.  Syntax:  node ./index.js DidListFile ConfigFile")
        process.exit(1)
    }
    const didListFile = args[0]
    let rawConfig = fs.readFileSync(args[1]);
    let configs = JSON.parse(rawConfig);
    if (!configs) {
        console.error("Cannot read config")
        process.exit(1)
    }
    let rewards = []
    let totalRewards=new Decimal(0)
    let config
    for(config of configs){
        config.decMinReward=new Decimal(config.minPayment)
        config.chunkSize = parseInt( (parseInt(config.endBlockNo)-parseInt(config.startBlockNo))/parseInt(config.partitions))
        console.log("Start to get rewards for chain: "+config.chainId+", partitions:"+config.partitions+" -> chunkSize:"+config.chunkSize)
        rewards[config.chainId] = []
        const web3 = new Web3(config.rpc)
        const chainId = config.chainId
        const startBlock = await web3.eth.getBlock(config.startBlockNo)
        const startBlockTimestamp = startBlock.timestamp
        const endBlock = await web3.eth.getBlock(config.endBlockNo)
        const endBlockTimestamp = endBlock.timestamp
        const dids = await getValidDids(chainId, didListFile)
        for (did of dids) {
            console.log("Computing for did " + did)
            const didShares = await getShares(did, config.subgraphURL, config.startBlockNo, config.endBlockNo, config.chunkSize)
            const consumes = await getConsumes(did, config.subgraphURL, startBlockTimestamp, endBlockTimestamp)
            //we have shares & consume nr..  let's calculate rewards
            for (share in didShares) {
                if(!rewards[chainId][share])
                    rewards[chainId][share] = new Decimal(0)
                // add reward based on the formula
                const reward = new Decimal(didShares[share]).plus(1).log(10).mul(StakeWeight).mul(Math.log10(consumes + 2)).mul(ConsumeWeight)
                rewards[chainId][share] = rewards[chainId][share].plus(reward)
                totalRewards = totalRewards.plus(reward)
            }
        }
        console.log("**********  Done getting rewards for chain: "+config.chainId)
    }
    const writeStream = fs.createWriteStream('rewards.csv')
    writeStream.write("ChainId,Address,Reward\n")
    const writeStreamChain = fs.createWriteStream('rewards_'+config.chainId+'.csv')
    writeStream.write("ChainId,Address,Reward\n")
    // compute final rewards, based on user reward & amount of tokens
    for(config of configs){
        const writeStreamChain = fs.createWriteStream('rewards_'+config.chainId+'.csv')
        writeStreamChain.write("Address,Reward\n")
        for (address in rewards[config.chainId]) {
            const reward =  new Decimal(rewards[config.chainId][address]).mul(OceanReward).div(totalRewards)
            if(reward.gte(config.decMinReward)){
                // do not add the reward to output, since it's below the threshold
                writeStream.write(config.chainId + "," + address + "," + reward.toFixed(6,Decimal.ROUND_UP) + "\n")
                writeStreamChain.write(address + "," + reward.toFixed(6,Decimal.ROUND_UP) + "\n")
            }
        }
    }
    console.log("Wrote results..Bye")
}



calculate()