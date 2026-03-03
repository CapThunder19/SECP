// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIRiskPredictor
 * @notice AI-powered risk prediction system for detecting market volatility
 * @dev Uses on-chain data and oracle feeds to predict liquidation risks
 */
contract AIRiskPredictor is Ownable {
    
    // Risk levels
    enum RiskLevel {
        Low,        // 0-30: Safe conditions
        Medium,     // 31-60: Monitor closely
        High,       // 61-80: Take defensive action
        Critical    // 81-100: Emergency mode
    }

    // Market conditions
    struct MarketCondition {
        uint256 volatilityIndex;     // 0-100
        uint256 liquidityScore;       // 0-100
        uint256 correlationIndex;     // Measures asset correlation
        uint256 timestamp;
        RiskLevel predictedRisk;
    }

    // User risk profile
    struct UserRiskProfile {
        uint256 riskScore;            // 0-100 (higher = riskier)
        uint256 healthFactor;         // From CollateralManager
        uint256 diversificationScore; // How diversified is collateral
        uint256 lastUpdate;
        bool autoProtectEnabled;      // Auto-trigger safety actions
    }

    // Historical market data for prediction
    mapping(uint256 => MarketCondition) public marketHistory;
    uint256 public currentPeriod;
    
    // User risk profiles
    mapping(address => UserRiskProfile) public userRiskProfiles;
    
    // Prediction parameters
    uint256 public volatilityThreshold = 70;    // Trigger at 70% volatility
    uint256 public liquidityThreshold = 30;      // Warning at 30% liquidity
    
    // AI model parameters (simplified on-chain implementation)
    int256[] public modelWeights;
    uint256 public constant WEIGHT_PRECISION = 1e18;

    event RiskPredicted(
        address indexed user,
        RiskLevel level,
        uint256 riskScore,
        string recommendation
    );
    
    event MarketConditionUpdated(
        uint256 indexed period,
        uint256 volatility,
        RiskLevel predictedRisk
    );
    
    event AutoProtectionTriggered(
        address indexed user,
        string action,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {
        // Initialize AI model weights (simplified neural network weights)
        modelWeights.push(int256(WEIGHT_PRECISION * 40 / 100));  // Volatility weight: 0.4
        modelWeights.push(int256(WEIGHT_PRECISION * 25 / 100));  // Liquidity weight: 0.25
        modelWeights.push(int256(WEIGHT_PRECISION * 20 / 100));  // Health factor weight: 0.2
        modelWeights.push(int256(WEIGHT_PRECISION * 15 / 100));  // Diversification weight: 0.15
    }

    /**
     * @notice Update market conditions (called by oracle or keeper)
     */
    function updateMarketConditions(
        uint256 volatility,
        uint256 liquidity,
        uint256 correlation
    ) external onlyOwner {
        require(volatility <= 100 && liquidity <= 100 && correlation <= 100, "Invalid range");
        
        currentPeriod++;
        
        RiskLevel predictedRisk = _calculateMarketRisk(volatility, liquidity, correlation);
        
        marketHistory[currentPeriod] = MarketCondition({
            volatilityIndex: volatility,
            liquidityScore: liquidity,
            correlationIndex: correlation,
            timestamp: block.timestamp,
            predictedRisk: predictedRisk
        });
        
        emit MarketConditionUpdated(currentPeriod, volatility, predictedRisk);
    }

    /**
     * @notice Predict risk for a specific user using AI model
     */
    function predictUserRisk(
        address user,
        uint256 healthFactor,
        uint256 diversification
    ) external returns (RiskLevel) {
        MarketCondition memory market = marketHistory[currentPeriod];
        
        // Calculate risk score using weighted model
        // riskScore = w1*volatility + w2*(100-liquidity) + w3*(100-healthFactor) + w4*(100-diversification)
        uint256 riskScore = _calculateRiskScore(
            market.volatilityIndex,
            market.liquidityScore,
            healthFactor,
            diversification
        );
        
        RiskLevel level = _getRiskLevel(riskScore);
        
        // Update user profile
        userRiskProfiles[user] = UserRiskProfile({
            riskScore: riskScore,
            healthFactor: healthFactor,
            diversificationScore: diversification,
            lastUpdate: block.timestamp,
            autoProtectEnabled: userRiskProfiles[user].autoProtectEnabled
        });
        
        string memory recommendation = _getRecommendation(level);
        emit RiskPredicted(user, level, riskScore, recommendation);
        
        // Auto-trigger protection if enabled
        if (userRiskProfiles[user].autoProtectEnabled && level >= RiskLevel.High) {
            _triggerAutoProtection(user, level);
        }
        
        return level;
    }

    /**
     * @notice Enable/disable auto-protection for user
     */
    function setAutoProtection(bool enabled) external {
        userRiskProfiles[msg.sender].autoProtectEnabled = enabled;
    }

    /**
     * @notice Calculate risk score using AI model weights
     */
    function _calculateRiskScore(
        uint256 volatility,
        uint256 liquidity,
        uint256 healthFactor,
        uint256 diversification
    ) internal view returns (uint256) {
        // Convert to risk factors (inverse for positive factors)
        uint256 liquidityRisk = 100 - liquidity;
        uint256 healthRisk = healthFactor > 100 ? 0 : (100 - healthFactor);
        uint256 diversificationRisk = 100 - diversification;
        
        // Apply weights
        uint256 score = (
            (volatility * uint256(modelWeights[0])) +
            (liquidityRisk * uint256(modelWeights[1])) +
            (healthRisk * uint256(modelWeights[2])) +
            (diversificationRisk * uint256(modelWeights[3]))
        ) / WEIGHT_PRECISION;
        
        // Normalize to 0-100
        return score > 100 ? 100 : score;
    }

    /**
     * @notice Calculate market-wide risk level
     */
    function _calculateMarketRisk(
        uint256 volatility,
        uint256 liquidity,
        uint256 correlation
    ) internal view returns (RiskLevel) {
        uint256 marketScore = (volatility * 50 + (100 - liquidity) * 30 + correlation * 20) / 100;
        return _getRiskLevel(marketScore);
    }

    /**
     * @notice Convert risk score to risk level
     */
    function _getRiskLevel(uint256 score) internal pure returns (RiskLevel) {
        if (score <= 30) return RiskLevel.Low;
        if (score <= 60) return RiskLevel.Medium;
        if (score <= 80) return RiskLevel.High;
        return RiskLevel.Critical;
    }

    /**
     * @notice Get risk recommendation
     */
    function _getRecommendation(RiskLevel level) internal pure returns (string memory) {
        if (level == RiskLevel.Low) return "Safe - Continue normal operations";
        if (level == RiskLevel.Medium) return "Monitor - Watch your health factor";
        if (level == RiskLevel.High) return "Warning - Consider adding collateral";
        return "Critical - Immediate action required";
    }

    /**
     * @notice Trigger automated protection actions
     */
    function _triggerAutoProtection(address user, RiskLevel level) internal {
        string memory action;
        
        if (level == RiskLevel.Critical) {
            action = "Emergency: Liquidation protection activated";
        } else if (level == RiskLevel.High) {
            action = "Warning: Portfolio rebalancing suggested";
        } else {
            action = "Monitor: Increased position monitoring";
        }
        
        emit AutoProtectionTriggered(user, action, block.timestamp);
    }

    /**
     * @notice Update AI model weights (governance function)
     */
    function updateModelWeights(int256[] calldata newWeights) external onlyOwner {
        require(newWeights.length == 4, "Must provide 4 weights");
        
        // Validate weights sum to ~1.0 (with precision)
        int256 sum = 0;
        for (uint i = 0; i < newWeights.length; i++) {
            require(newWeights[i] >= 0, "Weights must be positive");
            sum += newWeights[i];
        }
        require(sum == int256(WEIGHT_PRECISION), "Weights must sum to 1.0");
        
        delete modelWeights;
        for (uint i = 0; i < newWeights.length; i++) {
            modelWeights.push(newWeights[i]);
        }
    }

    /**
     * @notice Get current market risk level
     */
    function getCurrentMarketRisk() external view returns (RiskLevel) {
        if (currentPeriod == 0) return RiskLevel.Low;
        return marketHistory[currentPeriod].predictedRisk;
    }

    /**
     * @notice Get user risk profile
     */
    function getUserRiskProfile(address user) 
        external 
        view 
        returns (
            uint256 riskScore,
            uint256 healthFactor,
            uint256 diversification,
            bool autoProtect
        ) 
    {
        UserRiskProfile memory profile = userRiskProfiles[user];
        return (
            profile.riskScore,
            profile.healthFactor,
            profile.diversificationScore,
            profile.autoProtectEnabled
        );
    }
}
