// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAIRiskPredictor {
    enum RiskLevel { Low, Medium, High, Critical }
    
    function predictUserRisk(address user, uint256 healthFactor, uint256 diversification) external returns (RiskLevel);
    function getCurrentMarketRisk() external view returns (RiskLevel);
    function getUserRiskProfile(address user) external view returns (uint256, uint256, uint256, bool);
}
