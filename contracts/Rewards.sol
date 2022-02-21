//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./interfaces/IERC20.sol";

contract Rewards {
 
    address public owner;
    address public ocean;

    mapping(address => uint) public rewards;

    modifier onlyOwner(){
        require(owner == msg.sender,'NOT OWNER');
        _;
    }

    constructor(address _owner, address _ocean) {
        owner = _owner;
        ocean = _ocean;
    }

    function withdrawOcean() external onlyOwner {
        uint leftOcean = IERC20(ocean).balanceOf(address(this));
        
        require(IERC20(ocean).transfer(owner,leftOcean),'Failed to transfer Ocean');
    } 

    function getOceanBalance() external view returns (uint) {
       return IERC20(ocean).balanceOf(address(this));
    }

    function setRewards(address[] memory users, uint[] memory amounts) external onlyOwner {

        for(uint i = 0; i < users.length; i++) {
            rewards[users[i]] = rewards[users[i]]+amounts[i];
        }

    }

    function getRewards() external {
        require(rewards[msg.sender] > 0,'No reward available');
        require (IERC20(ocean).balanceOf(address(this))>= rewards[msg.sender],'Not enough Ocean');

        uint reward = rewards[msg.sender];
        rewards[msg.sender] = 0;

        require(IERC20(ocean).transfer(msg.sender,reward),'Failed to transfer Ocean');
    }   

}
