[![banner](https://raw.githubusercontent.com/oceanprotocol/art/master/github/repo-banner%402x.png)](https://oceanprotocol.com)

# Ocean Data Farming Script

For each did that matches the chainId:

          1. get pools for that did

          2. get snapshots of shares from startBlock to endBlock, from chunk to chunk

          3. compute average share  (sum all shares from step 2 and dividem them by nr of snapshots)

          4. get consume count

          5. compute reward

          6. add reward for did to global rewards

Write rewards to csv

## Install deps
```bash
npm i
```

## dids.json
  This contains the list of accepted dids and their chain.id
  Example:
  ```json
  [
    {
        "did": "did:op:a2B8b3aC4207CFCCbDe4Ac7fa40214fd00A2BA71",
        "chainId": 1
    },
    {
        "did": "did:op:7Bce67697eD2858d0683c631DdE7Af823b7eea38",
        "chainId": 1
    },
    {
        "did": "did:op:b07a8bb80242752ce164560ABCb6517DA90a4F65",
        "chainId": 1
    },
    {
        "did": "did:op:326e6BbFc725b63A7BC3c7C052C48d10d9D3BFCf",
        "chainId": 137
    },
    {
        "did": "did:op:3af10546654FCe4b42D948aB485D13D9EFB427D7",
        "chainId": 137
    },
    {
        "did": "did:op:2a82D20D65565Be093576Ed9000c4b853D005be3",
        "chainId": 56
    }
]
```

## Config.json
   This contains the config parameters, for each network:
   ```json
   [
    {
        "subgraphURL":"https://subgraph.mainnet.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph",
        "chainId":1,
        "startBlockNo":10100645,
        "endBlockNo":13100645,
        "rpc":"https://mainnet.infura.io/v3/XXXXX",
        "chunkSize": 100000
    },
    {
        "subgraphURL":"https://subgraph.bsc.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph",
        "chainId":56,
        "startBlockNo":10004272,
        "endBlockNo":10364272,
        "rpc":"https://bsc-dataseed.binance.org/",
        "chunkSize": 100000
    },
    {
        "subgraphURL":"https://subgraph.polygon.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph",
        "chainId":137,
        "startBlockNo":13413668,
        "endBlockNo":18413668,
        "rpc":"https://polygon-mainnet.infura.io/v3/XXXX",
        "chunkSize": 100000
    }
]
   ```
      

## Run the script
```bash
node ./index.js dids.json config.json 
```
This will calculate rewards for mainnet, from block 10912100 to block 12912700, using shares snapshots every 1000000 blocks
Rewards are written to a file (check output)

## 🏛 License

```text
Copyright 2021 Ocean Protocol Foundation Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
