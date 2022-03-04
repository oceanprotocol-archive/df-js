# DF Script (JS)

Data Farming script in JS. Consider it the alpha.

Related repos: [df-issues](https://github.com/oceanprotocol/df-issues), [df-py](https://github.com/oceanprotocol/df-py).

## Main logic

```text
    Get list of approved tokens
    For each pool that has baseToken in approved tokens list:
        - get did  (fetch nft, compose did)
        - make sure it's not in purgatory
        - get consume count (in Ocean + USDT) for that asset in interval startBlock -> endBlock
        - fetch average shares in the pool during interval for each user by taking snapshots every chunkSize from startBlock to endBlock
        - compute reward according to formula (this is per pool per user)
        - add rewards to global rewards object
    Normalize rewards (ie: add rewards from multiple pools for the same user)
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

# NOTES

1. This script depends on ocean.js, which depends on ocean-contracts.
When a new set of smartcontracts is deployed, we need to bump ocean.js dep here as well
Also, we are fetching the following from ocean.js/ocean-contracts:
    - OCEAN token address (it's different for every network)
    - ssContract address (we need to remove that from list of rewards, cause ssContract has a lot of lp shares)
    - subgraph urls  (instead of hardcoding them in our script)
    - aquarius class to fetch the ddo

2. USDT Consume volume is not available in the subgraph now. But since all pools are OCEAN based, we are using OCEAN consume volume instead.

3. ChunkSize.   Of course, it would be easy to fetch amount of pool shares every Sunday night, at midnight. But malicios actors will add liqudity Sunday and remove it Monday. And then add it again Sunday, thus having full reward.

    In order to mitigate this, we need to average no of pool shares by having snapshots during the startBlock -> EndBlock interval.

    Script supports granularity at level of 1 block, but this will take a lot of time. (milions of requests to our subgraph).

    The challenge is to find the right balance (maybe every hour?). Please take into account that different network have different average time between blocks , so a chunkSize of 257 equals about one hour on mainnet, but on polygon is just 20 mins.

# Example:

To compute DF farming rewards on rinkeby, from block 10182337 to block 10268436 while taking a snapshot every 10000 and having a total OCEAN reward of 25000, run the following:

```bash
node ./script/index.js 4 10182337 10268436 10000 25000
```

This will generate the following output  (all debug statemens are true)

```bash
alx@ubuntu:/ocean/datafarming-private$ node ./script/index.js 4 10182337 10268436 10000 25000
Start to get rewards for chain: 4, StartBlock: 10182337, EndBlock: 10268436, chunkSize:10000
Got a total of 39 pools that are a match
	 Checking DID did:op:f6c324713e4d88dd52bc75a85834695cdf83c80767898288b22dd7e93b1e166a (with pool 0x04568070ae2deaced03a4b4950739e6ad0aa1502)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:e00b002c9e769473709ff82f00dab646542546d3ef05a092499c801d490a41d8 (with pool 0x04eeab25fbb97b38b1883dc5d6a2ee193ef52e0b)
		 Got 0 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x04eeab25fbb97b38b1883dc5d6a2ee193ef52e0b there are no shares
					 At block 10192337 for pool 0x04eeab25fbb97b38b1883dc5d6a2ee193ef52e0b there are no shares
					 At block 10202337 for pool 0x04eeab25fbb97b38b1883dc5d6a2ee193ef52e0b there are no shares
					 At block 10212337 for pool 0x04eeab25fbb97b38b1883dc5d6a2ee193ef52e0b we have the following ratio of lp shares:
						 0xc50ce98b13aa9782cac4af6809007b2b035e599e:  0.5
					 At block 10222337 for pool 0x04eeab25fbb97b38b1883dc5d6a2ee193ef52e0b we have the following ratio of lp shares:
						 0xc50ce98b13aa9782cac4af6809007b2b035e599e:  0.5
					 At block 10232337 for pool 0x04eeab25fbb97b38b1883dc5d6a2ee193ef52e0b we have the following ratio of lp shares:
						 0xc50ce98b13aa9782cac4af6809007b2b035e599e:  0.5
					 At block 10242337 for pool 0x04eeab25fbb97b38b1883dc5d6a2ee193ef52e0b we have the following ratio of lp shares:
						 0xc50ce98b13aa9782cac4af6809007b2b035e599e:  0.5
					 At block 10252337 for pool 0x04eeab25fbb97b38b1883dc5d6a2ee193ef52e0b we have the following ratio of lp shares:
						 0xc50ce98b13aa9782cac4af6809007b2b035e599e:  0.5
					 At block 10262337 for pool 0x04eeab25fbb97b38b1883dc5d6a2ee193ef52e0b we have the following ratio of lp shares:
						 0xc50ce98b13aa9782cac4af6809007b2b035e599e:  0.5
				For pool 0x04eeab25fbb97b38b1883dc5d6a2ee193ef52e0b we have the following final shares ratio:
					 0xc50ce98b13aa9782cac4af6809007b2b035e599e : Total of 3 shares over 9 snapshots -> avg: 0.33333333333333333333
		 Got a total of 1 liquidity providers
			 User 0xc50ce98b13aa9782cac4af6809007b2b035e599e has reward: 0.037611 [ log(0.333334 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.037611
	 Checking DID did:op:953b971a8364375bee65d30ce14dd4738d34e5f884750fa8534ff8c259452a28 (with pool 0x082fefc723d3db52931fcb6a64182546f25e84e3)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:66013db2a119baf6684bab2df98f49ae893085a4cd0ed78ac4a9f5ac9ac9ac29 (with pool 0x0ac3a185b47e64b9921cb52c8aff8e6bc11cb7ed)
		 Got 3.212532391135936 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x0ac3a185b47e64b9921cb52c8aff8e6bc11cb7ed there are no shares
					 At block 10192337 for pool 0x0ac3a185b47e64b9921cb52c8aff8e6bc11cb7ed there are no shares
					 At block 10202337 for pool 0x0ac3a185b47e64b9921cb52c8aff8e6bc11cb7ed there are no shares
					 At block 10212337 for pool 0x0ac3a185b47e64b9921cb52c8aff8e6bc11cb7ed there are no shares
					 At block 10222337 for pool 0x0ac3a185b47e64b9921cb52c8aff8e6bc11cb7ed we have the following ratio of lp shares:
						 0x134b4edd7de8ea003e721e7670800ba97d9af1fd:  0.5
					 At block 10232337 for pool 0x0ac3a185b47e64b9921cb52c8aff8e6bc11cb7ed we have the following ratio of lp shares:
						 0x134b4edd7de8ea003e721e7670800ba97d9af1fd:  0.5
					 At block 10242337 for pool 0x0ac3a185b47e64b9921cb52c8aff8e6bc11cb7ed we have the following ratio of lp shares:
						 0x134b4edd7de8ea003e721e7670800ba97d9af1fd:  0.5
					 At block 10252337 for pool 0x0ac3a185b47e64b9921cb52c8aff8e6bc11cb7ed we have the following ratio of lp shares:
						 0x134b4edd7de8ea003e721e7670800ba97d9af1fd:  0.5
					 At block 10262337 for pool 0x0ac3a185b47e64b9921cb52c8aff8e6bc11cb7ed we have the following ratio of lp shares:
						 0x134b4edd7de8ea003e721e7670800ba97d9af1fd:  0.5
				For pool 0x0ac3a185b47e64b9921cb52c8aff8e6bc11cb7ed we have the following final shares ratio:
					 0x134b4edd7de8ea003e721e7670800ba97d9af1fd : Total of 2.5 shares over 9 snapshots -> avg: 0.27777777777777777778
		 Got a total of 1 liquidity providers
			 User 0x134b4edd7de8ea003e721e7670800ba97d9af1fd has reward: 0.076334 [ log(0.277778 + 1) * log(3.212533 + 2) ] -> totalRewards: 0.113944
	 Checking DID did:op:5a0aa8cea6bc67d7a9a2e1d8a23965191b9e5f9f68c863f2584e888e10769560 (with pool 0x0d306ee09a1065f80a8157e054123b4251f7ea98)
		 Got 10.861995339750104 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x0d306ee09a1065f80a8157e054123b4251f7ea98 there are no shares
					 At block 10192337 for pool 0x0d306ee09a1065f80a8157e054123b4251f7ea98 there are no shares
					 At block 10202337 for pool 0x0d306ee09a1065f80a8157e054123b4251f7ea98 there are no shares
					 At block 10212337 for pool 0x0d306ee09a1065f80a8157e054123b4251f7ea98 we have the following ratio of lp shares:
						 0x968d4670c346275edd5cc1a7535d14b631ffc49c:  0.5
					 At block 10222337 for pool 0x0d306ee09a1065f80a8157e054123b4251f7ea98 we have the following ratio of lp shares:
						 0x968d4670c346275edd5cc1a7535d14b631ffc49c:  0.5
					 At block 10232337 for pool 0x0d306ee09a1065f80a8157e054123b4251f7ea98 we have the following ratio of lp shares:
						 0x968d4670c346275edd5cc1a7535d14b631ffc49c:  0.5
					 At block 10242337 for pool 0x0d306ee09a1065f80a8157e054123b4251f7ea98 we have the following ratio of lp shares:
						 0x968d4670c346275edd5cc1a7535d14b631ffc49c:  0.5
					 At block 10252337 for pool 0x0d306ee09a1065f80a8157e054123b4251f7ea98 we have the following ratio of lp shares:
						 0x968d4670c346275edd5cc1a7535d14b631ffc49c:  0.5
					 At block 10262337 for pool 0x0d306ee09a1065f80a8157e054123b4251f7ea98 we have the following ratio of lp shares:
						 0x968d4670c346275edd5cc1a7535d14b631ffc49c:  0.5
				For pool 0x0d306ee09a1065f80a8157e054123b4251f7ea98 we have the following final shares ratio:
					 0x968d4670c346275edd5cc1a7535d14b631ffc49c : Total of 3 shares over 9 snapshots -> avg: 0.33333333333333333333
		 Got a total of 1 liquidity providers
			 User 0x968d4670c346275edd5cc1a7535d14b631ffc49c has reward: 0.138596 [ log(0.333334 + 1) * log(10.861996 + 2) ] -> totalRewards: 0.252540
	 Checking DID did:op:dcda1bbb4dbb5258ba64a0772526b8ce81b33696fd4bf4ab62214415d0c47c0d (with pool 0x1c643a7f7e23bccab0e8c7c68a32c47a91f53f00)
		 Got 0 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x1c643a7f7e23bccab0e8c7c68a32c47a91f53f00 there are no shares
					 At block 10192337 for pool 0x1c643a7f7e23bccab0e8c7c68a32c47a91f53f00 there are no shares
					 At block 10202337 for pool 0x1c643a7f7e23bccab0e8c7c68a32c47a91f53f00 there are no shares
					 At block 10212337 for pool 0x1c643a7f7e23bccab0e8c7c68a32c47a91f53f00 there are no shares
					 At block 10222337 for pool 0x1c643a7f7e23bccab0e8c7c68a32c47a91f53f00 there are no shares
					 At block 10232337 for pool 0x1c643a7f7e23bccab0e8c7c68a32c47a91f53f00 we have the following ratio of lp shares:
						 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
					 At block 10242337 for pool 0x1c643a7f7e23bccab0e8c7c68a32c47a91f53f00 we have the following ratio of lp shares:
						 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
					 At block 10252337 for pool 0x1c643a7f7e23bccab0e8c7c68a32c47a91f53f00 we have the following ratio of lp shares:
						 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
					 At block 10262337 for pool 0x1c643a7f7e23bccab0e8c7c68a32c47a91f53f00 we have the following ratio of lp shares:
						 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
				For pool 0x1c643a7f7e23bccab0e8c7c68a32c47a91f53f00 we have the following final shares ratio:
					 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84 : Total of 0 shares over 9 snapshots -> avg: 0
					 0xe75fa34968323219f4664080103746a605d18a47 : Total of 2 shares over 9 snapshots -> avg: 0.22222222222222222222
		 Got a total of 2 liquidity providers
			 User 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84 has reward: 0.000000 [ log(0.000000 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.252540
			 User 0xe75fa34968323219f4664080103746a605d18a47 has reward: 0.026235 [ log(0.222223 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.278775
	 Checking DID did:op:44372b5a6af670ac9abdcb239b9f28225a74a57d80ae33643dd27c334f5eccff (with pool 0x28ef3f1be2824db05f0bfdda7026c800872b139f)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:5d17994417759e97f9429ee5605302371ace55e33f359a281e22c6f0d11cbdc1 (with pool 0x301a67e2733361a7c9a33adedd214c2621c13a18)
		 Got 0 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x301a67e2733361a7c9a33adedd214c2621c13a18 there are no shares
					 At block 10192337 for pool 0x301a67e2733361a7c9a33adedd214c2621c13a18 there are no shares
					 At block 10202337 for pool 0x301a67e2733361a7c9a33adedd214c2621c13a18 there are no shares
					 At block 10212337 for pool 0x301a67e2733361a7c9a33adedd214c2621c13a18 there are no shares
					 At block 10222337 for pool 0x301a67e2733361a7c9a33adedd214c2621c13a18 there are no shares
					 At block 10232337 for pool 0x301a67e2733361a7c9a33adedd214c2621c13a18 there are no shares
					 At block 10242337 for pool 0x301a67e2733361a7c9a33adedd214c2621c13a18 there are no shares
					 At block 10252337 for pool 0x301a67e2733361a7c9a33adedd214c2621c13a18 there are no shares
					 At block 10262337 for pool 0x301a67e2733361a7c9a33adedd214c2621c13a18 there are no shares
		 Got a total of 0 liquidity providers
	 Checking DID did:op:1d5b7b89d27422e19d7b5e714e7d79fecc05bf325a43c32bce879e91d414b85e (with pool 0x46c9d0a72989765620440a9fcd50ae2e35513a0b)
		 Got 0 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x46c9d0a72989765620440a9fcd50ae2e35513a0b there are no shares
					 At block 10192337 for pool 0x46c9d0a72989765620440a9fcd50ae2e35513a0b there are no shares
					 At block 10202337 for pool 0x46c9d0a72989765620440a9fcd50ae2e35513a0b there are no shares
					 At block 10212337 for pool 0x46c9d0a72989765620440a9fcd50ae2e35513a0b there are no shares
					 At block 10222337 for pool 0x46c9d0a72989765620440a9fcd50ae2e35513a0b there are no shares
					 At block 10232337 for pool 0x46c9d0a72989765620440a9fcd50ae2e35513a0b there are no shares
					 At block 10242337 for pool 0x46c9d0a72989765620440a9fcd50ae2e35513a0b there are no shares
					 At block 10252337 for pool 0x46c9d0a72989765620440a9fcd50ae2e35513a0b there are no shares
					 At block 10262337 for pool 0x46c9d0a72989765620440a9fcd50ae2e35513a0b we have the following ratio of lp shares:
						 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
				For pool 0x46c9d0a72989765620440a9fcd50ae2e35513a0b we have the following final shares ratio:
					 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 : Total of 0 shares over 9 snapshots -> avg: 0
					 0xe75fa34968323219f4664080103746a605d18a47 : Total of 0.5 shares over 9 snapshots -> avg: 0.055555555555555555556
		 Got a total of 2 liquidity providers
			 User 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 has reward: 0.000000 [ log(0.000000 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.278775
			 User 0xe75fa34968323219f4664080103746a605d18a47 has reward: 0.033304 [ log(0.055556 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.285843
	 Checking DID did:op:561f18a723371fea3fae033354a4c1e80e35924ed8aacee32fc938fff7c35de3 (with pool 0x48af9bb92ded6ef7c6464af5d78169ead8e8adc9)
		 Got 0 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x48af9bb92ded6ef7c6464af5d78169ead8e8adc9 there are no shares
					 At block 10192337 for pool 0x48af9bb92ded6ef7c6464af5d78169ead8e8adc9 there are no shares
					 At block 10202337 for pool 0x48af9bb92ded6ef7c6464af5d78169ead8e8adc9 there are no shares
					 At block 10212337 for pool 0x48af9bb92ded6ef7c6464af5d78169ead8e8adc9 there are no shares
					 At block 10222337 for pool 0x48af9bb92ded6ef7c6464af5d78169ead8e8adc9 there are no shares
					 At block 10232337 for pool 0x48af9bb92ded6ef7c6464af5d78169ead8e8adc9 there are no shares
					 At block 10242337 for pool 0x48af9bb92ded6ef7c6464af5d78169ead8e8adc9 there are no shares
					 At block 10252337 for pool 0x48af9bb92ded6ef7c6464af5d78169ead8e8adc9 there are no shares
					 At block 10262337 for pool 0x48af9bb92ded6ef7c6464af5d78169ead8e8adc9 there are no shares
		 Got a total of 0 liquidity providers
	 Checking DID did:op:3d5bcdfb4865aa4dcadcd15fc139941d43d8c34c15a684dce710471bd3e55480 (with pool 0x544a638208adc2a86269211d89cf8631d9654062)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:0ee645e487f7b2a0306c920cf6f2770c4ee0b45f07ecd116398ab4e4bd1ccc86 (with pool 0x57eb6b733b77481ea339d448be4ae96f08ce5e26)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:172e91df7c225dbb5451039eaa8554a010c71bf8e4eb45889eab5e046a6584be (with pool 0x5875ca70b86395e2bc61823b6dcaa0da4ebbdcd2)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:bf3634f5ed10ce185346dbf569ef0f716541b7b84c16d5480e2b6b5c2e47c05d (with pool 0x66a181bcad8e53142162db4fca5075f830cb24ed)
		 Got 0 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x66a181bcad8e53142162db4fca5075f830cb24ed there are no shares
					 At block 10192337 for pool 0x66a181bcad8e53142162db4fca5075f830cb24ed there are no shares
					 At block 10202337 for pool 0x66a181bcad8e53142162db4fca5075f830cb24ed there are no shares
					 At block 10212337 for pool 0x66a181bcad8e53142162db4fca5075f830cb24ed there are no shares
					 At block 10222337 for pool 0x66a181bcad8e53142162db4fca5075f830cb24ed there are no shares
					 At block 10232337 for pool 0x66a181bcad8e53142162db4fca5075f830cb24ed there are no shares
					 At block 10242337 for pool 0x66a181bcad8e53142162db4fca5075f830cb24ed there are no shares
					 At block 10252337 for pool 0x66a181bcad8e53142162db4fca5075f830cb24ed we have the following ratio of lp shares:
						 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
					 At block 10262337 for pool 0x66a181bcad8e53142162db4fca5075f830cb24ed we have the following ratio of lp shares:
						 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
				For pool 0x66a181bcad8e53142162db4fca5075f830cb24ed we have the following final shares ratio:
					 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 : Total of 0 shares over 9 snapshots -> avg: 0
					 0xe75fa34968323219f4664080103746a605d18a47 : Total of 1 shares over 9 snapshots -> avg: 0.11111111111111111111
		 Got a total of 2 liquidity providers
			 User 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 has reward: 0.000000 [ log(0.000000 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.285843
			 User 0xe75fa34968323219f4664080103746a605d18a47 has reward: 0.047078 [ log(0.111112 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.299618
	 Checking DID did:op:35c26bef57dbcbd38c65d9592fd01caccbc4fa12b8023bc0eba58bc72284f4c9 (with pool 0x707ab41ff5e2d952dcc9446332c2f3a7b9791cb2)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:327817226ba27312af91987190a43bb14b8a664d79ebbde4a307a22e0884fb5b (with pool 0x739d4d701088cf5cf832ad95c099945712816c71)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:bd9935387775ff3aa0fe379b65c6a4169dcf8f2420b4583e5d717432dc548a94 (with pool 0x74f87e88f8ad712fcb3dc2f730febeba9827a4c9)
		 Got 2.6521665826641425 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x74f87e88f8ad712fcb3dc2f730febeba9827a4c9 there are no shares
					 At block 10192337 for pool 0x74f87e88f8ad712fcb3dc2f730febeba9827a4c9 there are no shares
					 At block 10202337 for pool 0x74f87e88f8ad712fcb3dc2f730febeba9827a4c9 there are no shares
					 At block 10212337 for pool 0x74f87e88f8ad712fcb3dc2f730febeba9827a4c9 there are no shares
					 At block 10222337 for pool 0x74f87e88f8ad712fcb3dc2f730febeba9827a4c9 we have the following ratio of lp shares:
						 0x3e81aa994f774ee914d57946ddf2486ea7d42d65:  0.5
					 At block 10232337 for pool 0x74f87e88f8ad712fcb3dc2f730febeba9827a4c9 we have the following ratio of lp shares:
						 0x3e81aa994f774ee914d57946ddf2486ea7d42d65:  0.5
					 At block 10242337 for pool 0x74f87e88f8ad712fcb3dc2f730febeba9827a4c9 we have the following ratio of lp shares:
						 0x3e81aa994f774ee914d57946ddf2486ea7d42d65:  0.5
					 At block 10252337 for pool 0x74f87e88f8ad712fcb3dc2f730febeba9827a4c9 we have the following ratio of lp shares:
						 0x3e81aa994f774ee914d57946ddf2486ea7d42d65:  0.5
					 At block 10262337 for pool 0x74f87e88f8ad712fcb3dc2f730febeba9827a4c9 we have the following ratio of lp shares:
						 0x3e81aa994f774ee914d57946ddf2486ea7d42d65:  0.5
				For pool 0x74f87e88f8ad712fcb3dc2f730febeba9827a4c9 we have the following final shares ratio:
					 0x3e81aa994f774ee914d57946ddf2486ea7d42d65 : Total of 2.5 shares over 9 snapshots -> avg: 0.27777777777777777778
		 Got a total of 1 liquidity providers
			 User 0x3e81aa994f774ee914d57946ddf2486ea7d42d65 has reward: 0.071076 [ log(0.277778 + 1) * log(2.652167 + 2) ] -> totalRewards: 0.370693
	 Checking DID did:op:6322f0bb578801d9849e30bae7fb00700f8f9bb2ee9fd4fcaac14aeefa2c294e (with pool 0x7de9dd0797bc9fad1ef6ddc3ae5c44d231e23c84)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:99fd9981a1b6b0cdff2c88622ffd8a16c6f41952e8bcd62c786f97dc33fc0aee (with pool 0x8806060cf75ae717092bc74441de7a19d0a34eb7)
		 Got 4.256990990193005 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x8806060cf75ae717092bc74441de7a19d0a34eb7 there are no shares
					 At block 10192337 for pool 0x8806060cf75ae717092bc74441de7a19d0a34eb7 there are no shares
					 At block 10202337 for pool 0x8806060cf75ae717092bc74441de7a19d0a34eb7 there are no shares
					 At block 10212337 for pool 0x8806060cf75ae717092bc74441de7a19d0a34eb7 there are no shares
					 At block 10222337 for pool 0x8806060cf75ae717092bc74441de7a19d0a34eb7 there are no shares
					 At block 10232337 for pool 0x8806060cf75ae717092bc74441de7a19d0a34eb7 there are no shares
					 At block 10242337 for pool 0x8806060cf75ae717092bc74441de7a19d0a34eb7 there are no shares
					 At block 10252337 for pool 0x8806060cf75ae717092bc74441de7a19d0a34eb7 there are no shares
					 At block 10262337 for pool 0x8806060cf75ae717092bc74441de7a19d0a34eb7 we have the following ratio of lp shares:
						 0xbee7e78668fd81d02d33fc41aad70aaa815b0916:  0.5
				For pool 0x8806060cf75ae717092bc74441de7a19d0a34eb7 we have the following final shares ratio:
					 0xbee7e78668fd81d02d33fc41aad70aaa815b0916 : Total of 0.5 shares over 9 snapshots -> avg: 0.055555555555555555556
		 Got a total of 1 liquidity providers
			 User 0xbee7e78668fd81d02d33fc41aad70aaa815b0916 has reward: 0.018700 [ log(0.055556 + 1) * log(4.256991 + 2) ] -> totalRewards: 0.389393
	 Checking DID did:op:52f714cc9e6e3c338ed1fcc3d3de0b66412b4cbda5847cb0d6d13ad954ad39bd (with pool 0x8820d67a7294a6aff70305c10fd924aec39b2d57)
		 Got 0 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x8820d67a7294a6aff70305c10fd924aec39b2d57 there are no shares
					 At block 10192337 for pool 0x8820d67a7294a6aff70305c10fd924aec39b2d57 there are no shares
					 At block 10202337 for pool 0x8820d67a7294a6aff70305c10fd924aec39b2d57 there are no shares
					 At block 10212337 for pool 0x8820d67a7294a6aff70305c10fd924aec39b2d57 there are no shares
					 At block 10222337 for pool 0x8820d67a7294a6aff70305c10fd924aec39b2d57 there are no shares
					 At block 10232337 for pool 0x8820d67a7294a6aff70305c10fd924aec39b2d57 we have the following ratio of lp shares:
						 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
					 At block 10242337 for pool 0x8820d67a7294a6aff70305c10fd924aec39b2d57 we have the following ratio of lp shares:
						 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
					 At block 10252337 for pool 0x8820d67a7294a6aff70305c10fd924aec39b2d57 we have the following ratio of lp shares:
						 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
					 At block 10262337 for pool 0x8820d67a7294a6aff70305c10fd924aec39b2d57 we have the following ratio of lp shares:
						 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
				For pool 0x8820d67a7294a6aff70305c10fd924aec39b2d57 we have the following final shares ratio:
					 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84 : Total of 0 shares over 9 snapshots -> avg: 0
					 0xe75fa34968323219f4664080103746a605d18a47 : Total of 2 shares over 9 snapshots -> avg: 0.22222222222222222222
		 Got a total of 2 liquidity providers
			 User 0x2b27e5dcd23ea3108f806bbeee844edeea91ee84 has reward: 0.000000 [ log(0.000000 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.389393
			 User 0xe75fa34968323219f4664080103746a605d18a47 has reward: 0.073313 [ log(0.222223 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.415628
	 Checking DID did:op:a25b51b24169214ecdf1ddb79a0afef980729a019e012e87165ed854718cd306 (with pool 0x88bc13747a5a8872fc5bff84667b47905a7774ae)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:1b5c448fde1be7ba98afc84b614e28a0903ceeb32ecc612116f67158f26629fb (with pool 0x8d9bac4fc20b11756de0fdee8304f3fddecaf529)
		 Got 0 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x8d9bac4fc20b11756de0fdee8304f3fddecaf529 there are no shares
					 At block 10192337 for pool 0x8d9bac4fc20b11756de0fdee8304f3fddecaf529 there are no shares
					 At block 10202337 for pool 0x8d9bac4fc20b11756de0fdee8304f3fddecaf529 there are no shares
					 At block 10212337 for pool 0x8d9bac4fc20b11756de0fdee8304f3fddecaf529 there are no shares
					 At block 10222337 for pool 0x8d9bac4fc20b11756de0fdee8304f3fddecaf529 there are no shares
					 At block 10232337 for pool 0x8d9bac4fc20b11756de0fdee8304f3fddecaf529 there are no shares
					 At block 10242337 for pool 0x8d9bac4fc20b11756de0fdee8304f3fddecaf529 there are no shares
					 At block 10252337 for pool 0x8d9bac4fc20b11756de0fdee8304f3fddecaf529 there are no shares
					 At block 10262337 for pool 0x8d9bac4fc20b11756de0fdee8304f3fddecaf529 we have the following ratio of lp shares:
						 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
				For pool 0x8d9bac4fc20b11756de0fdee8304f3fddecaf529 we have the following final shares ratio:
					 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 : Total of 0 shares over 9 snapshots -> avg: 0
					 0xe75fa34968323219f4664080103746a605d18a47 : Total of 0.5 shares over 9 snapshots -> avg: 0.055555555555555555556
		 Got a total of 2 liquidity providers
			 User 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 has reward: 0.000000 [ log(0.000000 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.415628
			 User 0xe75fa34968323219f4664080103746a605d18a47 has reward: 0.080382 [ log(0.055556 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.422696
	 Checking DID did:op:95e0756b954362eca683ada510f0e48a4348500b0a68ff8e6cbd4d4b4fd4bf76 (with pool 0x9069eaa3b70d4124c86afdd80bfd418ce59c5030)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:6bb94b855156264ea582344b422c337675197c17efdd901a8226f141ac983d7c (with pool 0x94bd08d4f1351f6c66bea50d829e5da0d218dae2)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:f938708dd11c09248f6e78e3771f198ffbc3cfc2f39f8613d6e22ab7d52417bc (with pool 0x950f5457119069dded023ef6d351d052559a47ea)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:a913e6d6d6f26938d1c07999e45bc247e32a8ef382e6bf3c1c2676c4fd2423ae (with pool 0x9acac5de4af63201e0550fd75d891123cf02b555)
		 Got 0.4509962881822339 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x9acac5de4af63201e0550fd75d891123cf02b555 there are no shares
					 At block 10192337 for pool 0x9acac5de4af63201e0550fd75d891123cf02b555 there are no shares
					 At block 10202337 for pool 0x9acac5de4af63201e0550fd75d891123cf02b555 there are no shares
					 At block 10212337 for pool 0x9acac5de4af63201e0550fd75d891123cf02b555 there are no shares
					 At block 10222337 for pool 0x9acac5de4af63201e0550fd75d891123cf02b555 there are no shares
					 At block 10232337 for pool 0x9acac5de4af63201e0550fd75d891123cf02b555 there are no shares
					 At block 10242337 for pool 0x9acac5de4af63201e0550fd75d891123cf02b555 there are no shares
					 At block 10252337 for pool 0x9acac5de4af63201e0550fd75d891123cf02b555 there are no shares
					 At block 10262337 for pool 0x9acac5de4af63201e0550fd75d891123cf02b555 we have the following ratio of lp shares:
						 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
				For pool 0x9acac5de4af63201e0550fd75d891123cf02b555 we have the following final shares ratio:
					 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 : Total of 0 shares over 9 snapshots -> avg: 0
					 0xe75fa34968323219f4664080103746a605d18a47 : Total of 0.5 shares over 9 snapshots -> avg: 0.055555555555555555556
		 Got a total of 2 liquidity providers
			 User 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 has reward: 0.000000 [ log(0.000000 + 1) * log(0.450997 + 2) ] -> totalRewards: 0.422696
			 User 0xe75fa34968323219f4664080103746a605d18a47 has reward: 0.089524 [ log(0.055556 + 1) * log(0.450997 + 2) ] -> totalRewards: 0.431838
	 Checking DID did:op:a776742a9851af7cbbac49f8e90e8da7dfc47f8f46046bb40cebe7ab2ab17273 (with pool 0x9af82ca72e700f0ac84ec817f39d03f094525365)
		 Got 0 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0x9af82ca72e700f0ac84ec817f39d03f094525365 there are no shares
					 At block 10192337 for pool 0x9af82ca72e700f0ac84ec817f39d03f094525365 there are no shares
					 At block 10202337 for pool 0x9af82ca72e700f0ac84ec817f39d03f094525365 there are no shares
					 At block 10212337 for pool 0x9af82ca72e700f0ac84ec817f39d03f094525365 there are no shares
					 At block 10222337 for pool 0x9af82ca72e700f0ac84ec817f39d03f094525365 there are no shares
					 At block 10232337 for pool 0x9af82ca72e700f0ac84ec817f39d03f094525365 we have the following ratio of lp shares:
						 0x134b4edd7de8ea003e721e7670800ba97d9af1fd:  0.29747481881684253866
						 0x4f5664c1b6e689fa6aefcc34e56841eb81e5c0d8:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.20252518118315746134
					 At block 10242337 for pool 0x9af82ca72e700f0ac84ec817f39d03f094525365 we have the following ratio of lp shares:
						 0x134b4edd7de8ea003e721e7670800ba97d9af1fd:  0.29747481881684253866
						 0x4f5664c1b6e689fa6aefcc34e56841eb81e5c0d8:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.20252518118315746134
					 At block 10252337 for pool 0x9af82ca72e700f0ac84ec817f39d03f094525365 we have the following ratio of lp shares:
						 0x134b4edd7de8ea003e721e7670800ba97d9af1fd:  0.29747481881684253866
						 0x4f5664c1b6e689fa6aefcc34e56841eb81e5c0d8:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.20252518118315746134
					 At block 10262337 for pool 0x9af82ca72e700f0ac84ec817f39d03f094525365 we have the following ratio of lp shares:
						 0x134b4edd7de8ea003e721e7670800ba97d9af1fd:  0.29747481881684253866
						 0x4f5664c1b6e689fa6aefcc34e56841eb81e5c0d8:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.20252518118315746134
				For pool 0x9af82ca72e700f0ac84ec817f39d03f094525365 we have the following final shares ratio:
					 0x134b4edd7de8ea003e721e7670800ba97d9af1fd : Total of 1.1898992752673701546 shares over 9 snapshots -> avg: 0.13221103058526335051
					 0x4f5664c1b6e689fa6aefcc34e56841eb81e5c0d8 : Total of 0 shares over 9 snapshots -> avg: 0
					 0xe75fa34968323219f4664080103746a605d18a47 : Total of 0.81010072473262984536 shares over 9 snapshots -> avg: 0.090011191636958871707
		 Got a total of 3 liquidity providers
			 User 0x134b4edd7de8ea003e721e7670800ba97d9af1fd has reward: 0.092568 [ log(0.132212 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.448072
			 User 0x4f5664c1b6e689fa6aefcc34e56841eb81e5c0d8 has reward: 0.000000 [ log(0.000000 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.448072
			 User 0xe75fa34968323219f4664080103746a605d18a47 has reward: 0.100792 [ log(0.090012 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.459340
	 Checking DID did:op:2c745f3658a4b197104410fb1781206fdbb81aac40a61d7331bf5df227e9bb79 (with pool 0xac022afb941ae0b7b90b44e0b5f64bd5e47262d7)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:a1578abc4968532d10fc95a40498dfb19f6668925576c93d46f24cf9485cd811 (with pool 0xb48b13efc6137ca6e5d710a454f76fe5fdcebd9e)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:8566ec860ad913a8a0e5648610139ac4c6ad4a2dd5f52aa25d856481488c023b (with pool 0xb80588f1ae5a3b7c797aace4886b22cbeffcbfe1)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:5bc1b2685bfc784a152d397912e4c8dc03d1021218b10db7deb47217ddc0a17a (with pool 0xc08afe96ba9824981cb36bb7b097d2fa4dc078ac)
		 Got 0 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0xc08afe96ba9824981cb36bb7b097d2fa4dc078ac there are no shares
					 At block 10192337 for pool 0xc08afe96ba9824981cb36bb7b097d2fa4dc078ac there are no shares
					 At block 10202337 for pool 0xc08afe96ba9824981cb36bb7b097d2fa4dc078ac there are no shares
					 At block 10212337 for pool 0xc08afe96ba9824981cb36bb7b097d2fa4dc078ac there are no shares
					 At block 10222337 for pool 0xc08afe96ba9824981cb36bb7b097d2fa4dc078ac there are no shares
					 At block 10232337 for pool 0xc08afe96ba9824981cb36bb7b097d2fa4dc078ac there are no shares
					 At block 10242337 for pool 0xc08afe96ba9824981cb36bb7b097d2fa4dc078ac there are no shares
					 At block 10252337 for pool 0xc08afe96ba9824981cb36bb7b097d2fa4dc078ac there are no shares
					 At block 10262337 for pool 0xc08afe96ba9824981cb36bb7b097d2fa4dc078ac we have the following ratio of lp shares:
						 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
				For pool 0xc08afe96ba9824981cb36bb7b097d2fa4dc078ac we have the following final shares ratio:
					 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 : Total of 0 shares over 9 snapshots -> avg: 0
					 0xe75fa34968323219f4664080103746a605d18a47 : Total of 0.5 shares over 9 snapshots -> avg: 0.055555555555555555556
		 Got a total of 2 liquidity providers
			 User 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 has reward: 0.000000 [ log(0.000000 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.459340
			 User 0xe75fa34968323219f4664080103746a605d18a47 has reward: 0.107860 [ log(0.055556 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.466408
	 Checking DID did:op:ca285f858304b20e4e319e9c1b17fcc60b8a2e08af8e52d88fd2b9427f9d5649 (with pool 0xde04d7c2416b16ec77d524b8d545a8a06607cb98)
		 Got 4.795528753391926 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0xde04d7c2416b16ec77d524b8d545a8a06607cb98 there are no shares
					 At block 10192337 for pool 0xde04d7c2416b16ec77d524b8d545a8a06607cb98 there are no shares
					 At block 10202337 for pool 0xde04d7c2416b16ec77d524b8d545a8a06607cb98 there are no shares
					 At block 10212337 for pool 0xde04d7c2416b16ec77d524b8d545a8a06607cb98 there are no shares
					 At block 10222337 for pool 0xde04d7c2416b16ec77d524b8d545a8a06607cb98 there are no shares
					 At block 10232337 for pool 0xde04d7c2416b16ec77d524b8d545a8a06607cb98 there are no shares
					 At block 10242337 for pool 0xde04d7c2416b16ec77d524b8d545a8a06607cb98 there are no shares
					 At block 10252337 for pool 0xde04d7c2416b16ec77d524b8d545a8a06607cb98 there are no shares
					 At block 10262337 for pool 0xde04d7c2416b16ec77d524b8d545a8a06607cb98 there are no shares
		 Got a total of 0 liquidity providers
	 Checking DID did:op:fde654c16043a1f1a76e8f364ccbe0885dc56eec9b0b5a2c1afd2beee420075c (with pool 0xdea8d68728a2b93c0c5c4561748eb33f0ecf192f)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:4a5de9e996f19154d4ce411f0b37a1e199cf42e48acae92be4074c3b85814803 (with pool 0xdef1b67e7095655ebae323cd17ee5f2c2ba225cb)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:7172b1f8768066721de76afdcfb8874cd54f01f0f778693f275ff273ba3c0ae5 (with pool 0xe18ac4c6957ceb3488c09d1865069878a47dd127)
		 Got 0.22549814409111696 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0xe18ac4c6957ceb3488c09d1865069878a47dd127 there are no shares
					 At block 10192337 for pool 0xe18ac4c6957ceb3488c09d1865069878a47dd127 there are no shares
					 At block 10202337 for pool 0xe18ac4c6957ceb3488c09d1865069878a47dd127 there are no shares
					 At block 10212337 for pool 0xe18ac4c6957ceb3488c09d1865069878a47dd127 there are no shares
					 At block 10222337 for pool 0xe18ac4c6957ceb3488c09d1865069878a47dd127 there are no shares
					 At block 10232337 for pool 0xe18ac4c6957ceb3488c09d1865069878a47dd127 there are no shares
					 At block 10242337 for pool 0xe18ac4c6957ceb3488c09d1865069878a47dd127 there are no shares
					 At block 10252337 for pool 0xe18ac4c6957ceb3488c09d1865069878a47dd127 there are no shares
					 At block 10262337 for pool 0xe18ac4c6957ceb3488c09d1865069878a47dd127 there are no shares
		 Got a total of 0 liquidity providers
	 Checking DID did:op:ac32bcce9374c9a2100cbd02a59fb8ff198b6ea03641b1979aea06e65e60cc42 (with pool 0xea44de3cf83b33f3e5b6a23e5bc94bd952eff63f)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:ed0b64ecf72de5931a146f160e090cb42a960da1dfbca7ea5674fdc40b54c75f (with pool 0xeab4bfcf8dd0fe5ac3a2e4b036ccf5375a2c882c)
		 Got 0 Ocean consume volume  and 0 USDT consume volume for this asset
					 At block 10182337 for pool 0xeab4bfcf8dd0fe5ac3a2e4b036ccf5375a2c882c there are no shares
					 At block 10192337 for pool 0xeab4bfcf8dd0fe5ac3a2e4b036ccf5375a2c882c there are no shares
					 At block 10202337 for pool 0xeab4bfcf8dd0fe5ac3a2e4b036ccf5375a2c882c there are no shares
					 At block 10212337 for pool 0xeab4bfcf8dd0fe5ac3a2e4b036ccf5375a2c882c there are no shares
					 At block 10222337 for pool 0xeab4bfcf8dd0fe5ac3a2e4b036ccf5375a2c882c there are no shares
					 At block 10232337 for pool 0xeab4bfcf8dd0fe5ac3a2e4b036ccf5375a2c882c there are no shares
					 At block 10242337 for pool 0xeab4bfcf8dd0fe5ac3a2e4b036ccf5375a2c882c there are no shares
					 At block 10252337 for pool 0xeab4bfcf8dd0fe5ac3a2e4b036ccf5375a2c882c there are no shares
					 At block 10262337 for pool 0xeab4bfcf8dd0fe5ac3a2e4b036ccf5375a2c882c we have the following ratio of lp shares:
						 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875:  0
						 0xe75fa34968323219f4664080103746a605d18a47:  0.5
				For pool 0xeab4bfcf8dd0fe5ac3a2e4b036ccf5375a2c882c we have the following final shares ratio:
					 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 : Total of 0 shares over 9 snapshots -> avg: 0
					 0xe75fa34968323219f4664080103746a605d18a47 : Total of 0.5 shares over 9 snapshots -> avg: 0.055555555555555555556
		 Got a total of 2 liquidity providers
			 User 0x3b2a8de44c8c5e2e472c67b3f8da75f26294e875 has reward: 0.000000 [ log(0.000000 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.466408
			 User 0xe75fa34968323219f4664080103746a605d18a47 has reward: 0.114929 [ log(0.055556 + 1) * log(0.000000 + 2) ] -> totalRewards: 0.473477
	 Checking DID did:op:1e1a14b8e5e3c4d1116b60812091b9ef4986790cd16a9bc3e12ebd1efc5e079e (with pool 0xeb3e68756b80d24828d3dd6f231542879f89d697)
		 Failed to fetch the DDO, skipping this pool
	 Checking DID did:op:a69eb3e989f7f7b2d9070bba0437b4c869e6448901205ef773ee707c2d02e9f8 (with pool 0xf3677e402a5db22929db027accd2b066214f056a)
		 Failed to fetch the DDO, skipping this pool

```

Let's look at the rewards file:

```bash
alx@ubuntu:/ocean/datafarming-private$ cat rewards_4_10182337_10268436_10000_25000.csv 

Address,RewardPercentage,TotalReward
0xc50ce98b13aa9782cac4af6809007b2b035e599e,7.943439,1985.859613
0x134b4edd7de8ea003e721e7670800ba97d9af1fd,19.550589,4887.647037
0x968d4670c346275edd5cc1a7535d14b631ffc49c,29.271909,7317.977204
0xe75fa34968323219f4664080103746a605d18a47,24.273248,6068.311859
0x3e81aa994f774ee914d57946ddf2486ea7d42d65,15.011405,3752.851230
0xbee7e78668fd81d02d33fc41aad70aaa815b0916,3.949413,987.353059
```


