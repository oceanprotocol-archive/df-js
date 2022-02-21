const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require("@openzeppelin/test-helpers");

describe("DataFarming", function () {
  let owner, user1, user2, user3, user4, user5;

  let rewards, ocean;

  let amount1 = ethers.utils.parseEther("1000"),
    amount2 = ethers.utils.parseEther("10"),
    amount3 = ethers.utils.parseEther("500"),
    amount4 = ethers.utils.parseEther("5.32451"),
    amount5 = ethers.utils.parseEther("0.000511962"),
    oceanSupply = ethers.utils.parseEther("100000000");


  it("Should deploy contracts", async function () {
    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    // DEPLOY OCEAN MOCK
    const Ocean = await ethers.getContractFactory("MockOcean");
    ocean = await Ocean.deploy(owner.address);
    await ocean.deployed();

    // DEPLOY REWARDS
    const Rewards = await ethers.getContractFactory("Rewards");
    rewards = await Rewards.deploy(owner.address, ocean.address);
    await rewards.deployed();

   
    expect(await ocean.balanceOf(owner.address)).to.equal(oceanSupply);
    expect(await ocean.balanceOf(user1.address)).to.equal(0);
    expect(await ocean.balanceOf(user2.address)).to.equal(0);
    expect(await ocean.balanceOf(user3.address)).to.equal(0);
    expect(await ocean.balanceOf(user4.address)).to.equal(0);
    expect(await ocean.balanceOf(user5.address)).to.equal(0);
  });

  it("Should set users rewards", async function () {
    const amounts = [amount1, amount2, amount3, amount4, amount5];
    const users = [
      user1.address,
      user2.address,
      user3.address,
      user4.address,
      user5.address,
    ];

    expect(await rewards.rewards(user1.address)).to.equal(0);
    expect(await rewards.rewards(user2.address)).to.equal(0);
    expect(await rewards.rewards(user3.address)).to.equal(0);
    expect(await rewards.rewards(user4.address)).to.equal(0);
    expect(await rewards.rewards(user5.address)).to.equal(0);

    await rewards.setRewards(users, amounts); // from owner

    expect(await rewards.rewards(user1.address)).to.equal(amount1);
    expect(await rewards.rewards(user2.address)).to.equal(amount2);
    expect(await rewards.rewards(user3.address)).to.equal(amount3);
    expect(await rewards.rewards(user4.address)).to.equal(amount4);
    expect(await rewards.rewards(user5.address)).to.equal(amount5);
  });

  it("Should allow user to withdraw rewards", async function () {


    expect(await rewards.rewards(user1.address)).to.equal(amount1);
    expect(await rewards.rewards(user2.address)).to.equal(amount2);
    expect(await rewards.rewards(user3.address)).to.equal(amount3);
    expect(await rewards.rewards(user4.address)).to.equal(amount4);
    expect(await rewards.rewards(user5.address)).to.equal(amount5);

    // shoyld fail to get rewards if not enough ocean
    await expectRevert(rewards.connect(user1).getRewards(), "Not enough Ocean");

    const rewardAmount = ethers.utils.parseEther("10000");

    // OPF transfer Ocean to the rewards contract
    await ocean.transfer(rewards.address, rewardAmount);
    expect(await ocean.balanceOf(rewards.address)).to.equal(rewardAmount);

    // owner has no rewards, reverts
    expect(await rewards.rewards(owner.address)).to.equal(0);
    await expectRevert(
      rewards.connect(owner).getRewards(),
      "No reward available"
    );

    // users collect available rewards
    await rewards.connect(user1).getRewards();
    expect(await rewards.rewards(user1.address)).to.equal(0);
    expect(await ocean.balanceOf(user1.address)).to.equal(amount1);

    await rewards.connect(user2).getRewards();
    expect(await rewards.rewards(user2.address)).to.equal(0);
    expect(await ocean.balanceOf(user2.address)).to.equal(amount2);

    await rewards.connect(user3).getRewards();
    expect(await rewards.rewards(user3.address)).to.equal(0);
    expect(await ocean.balanceOf(user3.address)).to.equal(amount3);

    await rewards.connect(user4).getRewards();
    expect(await rewards.rewards(user4.address)).to.equal(0);
    expect(await ocean.balanceOf(user4.address)).to.equal(amount4);

    await rewards.connect(user5).getRewards();
    expect(await rewards.rewards(user5.address)).to.equal(0);
    expect(await ocean.balanceOf(user5.address)).to.equal(amount5);

    expect(
      amount1
        .add(amount2)
        .add(amount3)
        .add(amount4)
        .add(amount5)
        .add(await ocean.balanceOf(rewards.address))
    ).to.equal(rewardAmount);
  });

  it("OPF should withdraw ocean left", async function () {

    const oceanRewardBalance = await ocean.balanceOf(rewards.address);
    expect(await ocean.balanceOf(rewards.address)).gt(0);

    const ownerOceanBalance = await ocean.balanceOf(owner.address);

    await expectRevert(rewards.connect(user1).withdrawOcean(), "NOT OWNER");

    // owner has no rewards, reverts
    await rewards.withdrawOcean();

    expect(await ocean.balanceOf(rewards.address)).to.equal(0);
    expect(ownerOceanBalance.add(oceanRewardBalance)).to.equal(
      await ocean.balanceOf(owner.address)
    );

    expect(
      amount1
        .add(amount2)
        .add(amount3)
        .add(amount4)
        .add(amount5)
        .add(await ocean.balanceOf(owner.address))
    ).to.equal(oceanSupply);
  });
});
