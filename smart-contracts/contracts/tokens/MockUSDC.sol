// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDC is ERC20, Ownable {
    uint256 public faucetAmount = 1000 ether;

    constructor() ERC20("Mock USDC", "mUSDC") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 ether);
    }

    function faucet() external {
        _mint(msg.sender, faucetAmount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function setFaucetAmount(uint256 _amount) external onlyOwner {
        faucetAmount = _amount;
    }
}
