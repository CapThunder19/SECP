// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockWBTC
 * @notice Mock Wrapped Bitcoin token for testing cross-chain collateral
 * @dev ERC20 token with 18 decimals (using standard decimals for frontend compatibility)
 */
contract MockWBTC is ERC20, Ownable {
    uint256 public faucetAmount = 100 * 1e18; // 100 WBTC per faucet call (18 decimals for testnet)

    constructor() ERC20("Mock Wrapped Bitcoin", "mWBTC") Ownable(msg.sender) {
        _mint(msg.sender, 21_000_000 * 1e18); // 21M WBTC max supply
    }

    /// @notice Override decimals - using 18 for testnet compatibility
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /// @notice Owner can mint for testing or liquidity provision
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Users can get test WBTC tokens
    function faucet() external {
        _mint(msg.sender, faucetAmount);
    }

    /// @notice Owner can change faucet amount
    function setFaucetAmount(uint256 amount) external onlyOwner {
        faucetAmount = amount;
    }
}
