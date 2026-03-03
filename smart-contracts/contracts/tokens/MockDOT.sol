// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockDOT
 * @notice Mock Polkadot (DOT) token for testing on Polkadot Hub
 * @dev ERC20 token with faucet functionality for testnet
 */
contract MockDOT is ERC20, Ownable {
    uint256 public faucetAmount = 100 * 1e18; // 100 DOT per faucet call

    constructor() ERC20("Mock Polkadot", "mDOT") Ownable(msg.sender) {
        _mint(msg.sender, 10_000_000 * 1e18); // 10M DOT initial supply
    }

    /// @notice Owner can mint for testing or liquidity provision
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Users can get test DOT tokens
    function faucet() external {
        _mint(msg.sender, faucetAmount);
    }

    /// @notice Owner can change faucet amount
    function setFaucetAmount(uint256 amount) external onlyOwner {
        faucetAmount = amount;
    }
}
