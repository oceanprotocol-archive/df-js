[![banner](https://raw.githubusercontent.com/oceanprotocol/art/master/github/repo-banner%402x.png)](https://oceanprotocol.com)

# Ocean Data Farming

This repo defines operations and eligibility criterias for Data Farming initiative by Ocean Protocol Foundation. This repo should be considered as single source-of-truth in case of any conflicts and confusion. One of the most important asset of this repo is `datafarms-list.json`. This list will contain details of all the datasets that are eligible for data farming rewards.

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

Data Farming is a community incentive program by Ocean Protocol Foundation aiming to achieve below objectives -

1. Accelerate supply of desired (domain and quality) data.
2. Increase TVL
3. Promote data consumption

There are other indirect benefits that arises out of this initiative -

1. Improved adoption rate of Ocean Protocol
2. Ocean community gets better educated on using Ocean Market and other dapps on Ocean Protocol
3. Increase in data trading volume (and network transactions)

## 🤑Reward Function

Current Reward Function is -

# *F<sub>ij</sub> = log<sub>10</sub>(S<sub>ij</sub>+1)W<sup>s</sup> * log<sub>10</sub>(D<sub>j</sub>+2)W<sup>d<sup>*



where:  
   
*S<sub>ij</sub>= actor i’s OCEAN stake in data asset j = (actor’s # BPTs in datatoken j’s pool / total # BPTs in pool)*
   
*D<sub>j</sub> = # times data asset j has been consumed in the last week (= # consume transfers to the datatoken j’s Provider)*
   
*W<sup>s</sup> = weight for stake (supply)* `s = 1`
   
*W<sup>d</sup> = weight for data consume volume* `d = 1`
   


> **Note** - Reward function might get updated on weekly basis in order to optimise towards desired Objectives. To make sure you are always using the correct reward function for your rewards calculation or in your dapp, always check the current reward function.

## 🚜 Rewards - Calculation & Distribution

Rewards for the current week will be calculated every Monday/Tuesday of the next week. And all eligible wallet addresses will be airdropped rewards on Tuesday or latest Wednesday. List of rewards distribution for a given week will also be published as `weekX-rewards.csv` in `rewards/` (X = week number) folder of this repo.

## ✅ Dataset Eligibility Criteria

In order to avoid OPF being the Certified Authority in defining eligibility criteria, we will start with bare minimum criterias for datasets to participate in Data Farming initiative.

These criterias are as follows -

1. Only datasets with 'Dynamic Pricing' are qualified for data farming rewards. (i.e.) Only datasets with data pools are qualified for data farming rewards.
2. Each dataset should have minimum 5 distinct stakers (excluding Data Provider) for that dataset to be qualified for data farming rewards.

> Note - If it is found that data provider is acting as staker using their other wallets on their own datasets, then their dataset will be disqualified and banned from data farming program further on.

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
