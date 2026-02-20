// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockOracle is Ownable {
    // token => price
    mapping(address => uint256) public prices;

    // Global market volatility (0 - 100)
    uint256 public marketVolatility;

    event PriceUpdated(address token, uint256 price);
    event VolatilityUpdated(uint256 volatility);

    constructor() Ownable(msg.sender) {}

    /// Set token price
    function setPrice(address token, uint256 price) external onlyOwner {
        prices[token] = price;
        emit PriceUpdated(token, price);
    }

    /// Get token price
    function getPrice(address token) external view returns (uint256) {
        return prices[token];
    }

    /// Update market volatility
    function setVolatility(uint256 vol) external onlyOwner {
        require(vol <= 100, "Invalid volatility");
        marketVolatility = vol;
        emit VolatilityUpdated(vol);
    }

    /// Simulate market crash
    function simulateCrash(address[] calldata tokens, uint256 dropPercent)
        external
        onlyOwner
    {
        require(dropPercent <= 100, "Invalid drop");

        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 current = prices[tokens[i]];
            uint256 newPrice = (current * (100 - dropPercent)) / 100;
            prices[tokens[i]] = newPrice;

            emit PriceUpdated(tokens[i], newPrice);
        }

        marketVolatility = 90;
        emit VolatilityUpdated(90);
    }
}
