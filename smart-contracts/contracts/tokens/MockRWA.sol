// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockRWA is ERC20, Ownable {
    uint256 public faucetAmount = 1000 * 1e18;

    constructor() ERC20("Mock RWA Token", "mRWA") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 1e18);
    }

    /// Owner can mint for testing or liquidity
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// Users can get test tokens
    function faucet() external {
        _mint(msg.sender, faucetAmount);
    }

    /// Owner can change faucet amount
    function setFaucetAmount(uint256 amount) external onlyOwner {
        faucetAmount = amount;
    }
}
