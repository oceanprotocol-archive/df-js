const fetch = require('cross-fetch')
const Web3 = require('web3')
const fs = require('fs');
const Decimal = require('decimal.js');
//const { config } = require('process');
const ocean = require('@oceanprotocol/lib')
const crypto = require('crypto-js');

const decMinReward = new Decimal(10)    /// if end reward is lower than 10, ignore it

if (!process.argv[2] || !process.argv[3] || !process.argv[4] || !process.argv[5] || !process.argv[6]) {
    console.error("Missing arguments. Required:  ChainID  StartBlock EndBlock Chunksize TotalOceanReward")
    process.exit(1)
}
const chainId = process.argv[2]
const startBlock = process.argv[3]
const endBlock = process.argv[4]
const chunkSize = process.argv[5]
const totalOceanReward = process.argv[6]
ocean.LoggerInstance.setLevel(-1)
const configHelper = new ocean.ConfigHelper()
const config = configHelper.getConfig(parseInt(chainId))
if (!config) process.exit(1)

const subgraphURL = config.subgraphUri + "/subgraphs/name/oceanprotocol/ocean-subgraph"
const aquariusURL = config.metadataCacheUri
const Aquarius = new ocean.Aquarius(aquariusURL)

process.on('uncaughtException', err => {
    console.log(`Uncaught Exception: ${err.message}`)
    process.exit(1)
})


calculate()




async function calculate() {
    /* 
    Get list of approved tokens
    For each pool that has baseToken in approved tokens list:
        get did  (fetch nft, compose did)
        make sure it's not in purgatory
        get snapshots of shares from startBlock to endBlock, in chunks
        compute average share  (sum all shares from step above and divide them by nr of chunks)
        get consume count
        compute reward
        add reward for did to global rewards
    Write rewards to csv
    */

    let rewards = []
    let totalRewards = new Decimal(0)
    console.log("Start to get rewards for chain: " + chainId + ", StartBlock: " + startBlock + ", EndBlock: " + endBlock + ", chunkSize:" + chunkSize)
    //get approved tokens from subgraph
    const approvedTokens = await getApprovedTokens()
    if (approvedTokens.length < 1) {
        console.error("No approved tokens. Bailing out")
        process.exit(1)
    }
    const pools = await getAllPools(approvedTokens)
    //loop through pools
    for (const pool of pools) {
        const did = 'did:op:' + crypto.SHA256(Web3.utils.toChecksumAddress(pool.datatoken.nft.id) + chainId.toString(10))
        //fetch the doo
        let ddo
        try {
            ddo = await Aquarius.resolve(did)
            //ceck if asset in purgatory
            if (ddo.purgatory && ddo.purgatory.state) {
                //this asset is in purgatory, skip it
                //console.log("DID:"+ did+" not found. Skipping..")
                continue
            }
            //console.log("DID:"+ did+" added")
        }
        catch (err) {
            //console.log("DID:"+ did+" not found. Skipping..")
            continue
        }
        // get total consume volume in usdt and ocean
        const { consumeVolumeUSDT, consumeVolumeOcean } = await getConsumeVolume(pool.datatoken.id, startBlock, endBlock)
        // fetch relative shares in the pool for each user by taking snapshots every chunkSize from startBlock to endBlock
        const relativeSharesPerUser = await getAvgSharesPerUser(pool.id, startBlock, endBlock, chunkSize)
        console.log("For pool "+pool.id +" we have the following relatives:")
        console.log(relativeSharesPerUser)
        for (user in relativeSharesPerUser) {
            if(!rewards[user])
                rewards[user] = new Decimal(0)
            // add reward based on the formula
            const stakeIncentive=new Decimal(relativeSharesPerUser[user]).plus(1)
            const consumeIncentive=new Decimal(consumeVolumeOcean).plus(2)
            const reward = Decimal.log(stakeIncentive).mul(Decimal.log(consumeIncentive))
            rewards[user] = rewards[user].plus(reward)
            totalRewards = totalRewards.plus(reward)
        }
        //move to next pool
    }
    //we have all rewards, we just need to wrap up the final array
    const writeStreamChain = fs.createWriteStream('rewards_'+chainId+"_"+startBlock+"_"+endBlock+"_"+chunkSize+"_"+totalOceanReward+".csv")
    writeStreamChain.write("Address,RewardPercentage,TotalReward\n")
    for (user in rewards) {
        const endReward =  new Decimal(rewards[user]).mul(totalOceanReward).div(totalRewards)
        const rewardPercentage = new Decimal(rewards[user]).mul(100).div(totalOceanReward)
        if(endReward.gte(decMinReward)){
            // do not add the reward to output, since it's below the threshold
            writeStream.write(user + "," + rewardPercentage.toFixed(6,Decimal.ROUND_UP) + ","+ endReward.toFixed(6,Decimal.ROUND_UP) + "\n")
        }
    }
    //end of script
}

async function getApprovedTokens() {
    const poolQuery = { query: `query {opcs{approvedTokens} }` }
    let tokens = []
    let response
    try {
        response = await fetch(subgraphURL, {
            method: 'POST',
            body: JSON.stringify(poolQuery),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const result = await response.json()
        if (result.data && result.data.opcs && result.data.opcs[0].approvedTokens)
            tokens = result.data.opcs[0].approvedTokens
    }
    catch (err) {
        console.log(err)
    }
    return tokens
}

async function getAllPools(approvedTokens) {
    let tokenList = ""
    for (token of approvedTokens)
        tokenList = tokenList + '"' + token + '",'
    tokenList = tokenList.slice(0, -1);  // remove the last comma
    let pools = []
    let response

    //since we don't know how many pools we have, let's fetch 1000 at a time (max subgraph)
    let skip = 0
    do {
        const poolQuery = {
            query: `query {
                        pools(where: {baseToken_in:[${tokenList}]},skip:${skip},first:1000){
                            id,
                            datatoken {
                                id,
                                nft {
                                    id
                                }
                            },
                            baseToken {
                                id
                            }
                        }
     
                    }`
        }
        try {
            response = await fetch(subgraphURL, {
                method: 'POST',
                body: JSON.stringify(poolQuery),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const result = await response.json()
            if (result.data && result.data.pools) {
                if (result.data.pools.length < 1) break
                for (const pool of result.data.pools)
                    pools.push(pool)
            }
        }
        catch (err) {
            console.log(err)
            break;
        }
        //move to next 1000 batch, if any
        skip = skip + 1000
    }
    while (true)
    return pools
}


async function getConsumeVolume(datatoken, startBlock, endBlock) {
    let consumeVolumeUSDT = 0
    let consumeVolumeOcean = 0
    //since we don't know how many orders we have, let's fetch 1000 at a time (max subgraph)
    let skip = 0
    do {
        const poolQuery = {
            query: `query {
                    orders(where: {block_gte:${startBlock}, block_lte:${endBlock}, datatoken_in:["${datatoken}"]},skip:${skip},first:1000){
                        id,
                        datatoken{
                            id
                        }
                        lastPriceToken,
                        lastPriceValue
                        estimatedUSDValue,
                        block
                    }
                }`
        }
        try {
            response = await fetch(subgraphURL, {
                method: 'POST',
                body: JSON.stringify(poolQuery),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const result = await response.json()
            if (result.data && result.data.orders) {
                if (result.data.orders.length < 1) break
                for (const order of result.data.orders) {
                    //consumeVolumeUSDT += parseFloat(order.estimatedUSDValue)
                    consumeVolumeUSDT += parseFloat(order.estimatedUSDValue)
                    if (order.lastPriceToken == config.oceanTokenAddress.toLowerCase())
                        consumeVolumeOcean += parseFloat(order.lastPriceValue)
                }
            }
        }
        catch (err) {
            console.log(err)
            break;
        }
        //move to next 1000 batch, if any
        skip = skip + 1000
    }
    while (true)
    return { consumeVolumeUSDT, consumeVolumeOcean }
}


async function getPoolSharesatBlock(poolId, block) {
    let totalPoolShares = 0
    let shares = []
    //let's 
    //since we don't know how many lps we have, let's fetch 1000 at a time (max subgraph)
    let skip = 0
    do {
        const query = {
            query: `query {
                        poolShares(skip:${skip}, first:1000, block:{number:${block}},where: {pool_in: ["${poolId}"]}){
                            pool{
                                id,
                                totalShares
                            },
                            shares,
                            user{
                                id
                            }
                        }
                    }`
        }
        
        const response = await fetch(subgraphURL, {
            method: 'POST',
            body: JSON.stringify(query)
        })
        const result = await response.json()
        
        if (result.data && result.data.poolShares) {
            if (result.data.poolShares.length < 1) break
            
            for (const poolShare of result.data.poolShares) {
                totalPoolShares = poolShare.pool.totalShares
                // exclude ss bot
                // if (poolShare.user.id == config.sideStakingAddress.toLowerCase()) continue
                if (poolShare.shares)
                    shares[poolShare.user.id] = new Decimal(poolShare.shares).div(totalPoolShares)
            }
        }
        skip=skip+1000
    }while(true)
    return(shares)
        
}


async function getAvgSharesPerUser(poolId, startBlock, endBlock, chunkSize) {
    let avgSharesPerUser = []
    let count = 0
    let i
    for (i = parseInt(startBlock); i <= parseInt(endBlock); i = i + parseInt(chunkSize)) {
        count++
        // let's fetch relativeUserShare during interval EndBlock - StartBlock, from chunk to chunk
        const relativeUserShares = await getPoolSharesatBlock(poolId,i)
        for (user in relativeUserShares) {
            if (!(user in avgSharesPerUser)){ 
                avgSharesPerUser[user] = new Decimal(0)
            }
            avgSharesPerUser[user] = avgSharesPerUser[user].plus(relativeUserShares[user])
        }
    }
    if (i < endBlock) {
        //do it for endBlock as well
        count++
        const relativeUserShares = await getPoolSharesatBlock(poolId,i)
        for (user in relativeUserShares) {
            if (!(user in avgSharesPerUser)){ 
                avgSharesPerUser[user] = new Decimal(0)
            }
            avgSharesPerUser[user] = avgSharesPerUser[user].plus(relativeUserShares[user])
        }
    }
    
    for (user in avgSharesPerUser) {
        //just do a simple average over blocks
        avgSharesPerUser[user] = new Decimal(avgSharesPerUser[user]).div(count)

    }
    return (avgSharesPerUser)
}

