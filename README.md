# DF Script (JS)

Data Farming script in JS. Consider it the alpha.

Related repos: [df-issues](https://github.com/oceanprotocol/df-issues), [df-py](https://github.com/oceanprotocol/df-py).

## Script algorithm

```text
For specific chain:
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
```

# Installation
```bash
npm i
```

# Run the script
```bash
node ./index.js chainId startBlock endBlock chunkSize totalOceanReward
```
Rewards are written to a file:
 - rewards_chainId_startBlock_endBlock_chunkSize_totalOceanReward.csv  (Address , Reward)



