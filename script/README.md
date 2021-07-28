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

## Valid DIDS
For now, the script loads a json file (dids.json).  Once the repo is going to be public, we are going to load dids from https://github.com/oceanprotocol/datafarming/blob/main/datafarms-list.json


## Install deps
```bash
npm i
```

## Run the script
```bash
node ./index.js https://mainnet.infura.io/v3/XXX 10912100 12912700 1000000
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
