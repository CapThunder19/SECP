// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockYield is ERC20, Ownable {
    uint256 public faucetAmount = 1000 * 1e18;

    constructor() ERC20("Mock Yield Token", "mYLD") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 1e18);
    }

    /// Owner minting (for protocol simulation)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// Faucet for users
    function faucet() external {
        _mint(msg.sender, faucetAmount);
    }

    /// Change faucet size
    function setFaucetAmount(uint256 amount) external onlyOwner {
        faucetAmount = amount;
    }
}
