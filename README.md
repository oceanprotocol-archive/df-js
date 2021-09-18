[![banner](https://raw.githubusercontent.com/oceanprotocol/art/master/github/repo-banner%402x.png)](https://oceanprotocol.com)

# Ocean Data Farming

This repo defines core operations and eligibility criterias for Ocean Data Farming (DF). This repo should be considered as single source-of-truth in case of any conflicts. One key file is `datafarms-list.json`, which lists the data pools that are eligible for DF rewards.

---

- [🌾 What is Data Farming?](#what-is-data-farming)
- [🤑 Reward Function](#reward-function)
- [🚜 Rewards - Calculation & Distribution](#rewards-calculation-&-Distribution)
- [✅ Dataset Eligibility Criteria](#dataset-eligibility-criteria)
- [❓ How to submit Datasets?](#how-to-submit-datasets)
- [🧑‍🌾 Farming List Usage](#️farming-list-usage)
- [🏛 License](#license)

---

## 🌾What is Data Farming

Ocean Data Farming is a rewards program that incentivizes for **data consume volume** and **data pool liquidity** in the Ocean ecosystem.

## 🤑Reward Function

The current Reward Function is -

# *F<sub>ij = log<sub>10</sub>(S<sub>ij</sub>+1) * log<sub>10</sub>(C<sub>j</sub>+2)*    

where:  
   
*S<sub>ij</sub>= actor i’s OCEAN stake in data asset j = (actor’s # BPTs in datatoken j’s pool / total # BPTs in pool)*
   
*C<sub>j</sub> = total consumption volume of data asset j in OCEAN tokens for the given week (= price of datatoken j in OCEAN tokens *  # of consumes)*
 
This reward function may get tuned weekly, based on feedback. We reflect updates to the reward function here.

## 🚜 Rewards - Calculation & Distribution

Rewards are calculated every Monday, looking back at the previous week. Rewards are airdropped to each pool every Tuesday. A list of rewards distribution for a given week is published as `weekX-rewards.csv` in `rewards/` (X = week number) folder of this repo.

## ✅ Data Pool Eligibility Criteria

Rewards go to data _pools_, not data assets. A data pool contains Ocean datatokens for given data service. That data service may be of any type - dataset (for static uris) or algorithm or compute (compute-to-data).
   
Criteria:
   
- Metadata must be plaintext, not encrypted
- Pool must be on Ocean supported production networks. Current list: Ethereum mainnet, Polygon, BSC
- Pool must use OCEAN liquidity
- The data service can’t be in [purgatory](https://github.com/oceanprotocol/list-purgatory/blob/main/policies/README.md) for copyright violations / DMCA notices, sensitive data, or trademark violations
   
These criteria may get tuned weekly, based on feedback. We reflect updates to the criteria here.

## ❓How to submit Datasets

> ToDo

## 🧑‍🌾 Farming List Usage

This list can be used by marketplaces and dapps building on Ocean Protocol (including Ocean Market) to signal qualified datasets for farming rewards to the community.

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
