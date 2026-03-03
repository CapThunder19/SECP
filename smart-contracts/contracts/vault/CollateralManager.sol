// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SmartVault.sol";
import "../interfaces/IAIRiskPredictor.sol";
import "../interfaces/IXCMBridge.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IOracle {
    function getPrice(address token) external view returns (uint256);
    function marketVolatility() external view returns (uint256);
}

interface ILoanManager {
    function debt(address user) external view returns (uint256);
    function isReliableBorrower(address user) external view returns (bool);
    function getLoanDuration(address user) external view returns (uint256);
}

contract CollateralManager is Ownable {
    SmartVault public vault;
    IOracle public oracle;
    ILoanManager public loanManager;
    IAIRiskPredictor public aiPredictor;
    IXCMBridge public xcmBridge;

    // Risk weights for different assets (100 = 100% safe, lower = riskier)
    mapping(address => uint256) public assetWeights;
    
    // Track cross-chain collateral by user
    mapping(address => mapping(IXCMBridge.Chain => uint256)) public crossChainCollateral;

    // Adaptive modes
    enum Mode {
        Flexible,
        Conservative,
        Freeze
    }

    mapping(address => Mode) public userMode;

    // LTV Configuration
    uint256 public constant MAX_LTV = 75; // 75% max loan-to-value
    uint256 public constant LIQUIDATION_THRESHOLD = 85; // 85% triggers liquidation
    uint256 public constant SAFE_THRESHOLD = 150; // 150% = healthy

    event ModeUpdated(address indexed user, Mode mode, string reason);
    event WeightUpdated(address indexed token, uint256 weight);
    event HealthFactorCalculated(address indexed user, uint256 healthFactor);

    constructor(
        address _vault,
        address _oracle,
        address _loanManager
    ) Ownable(msg.sender) {
        vault = SmartVault(_vault);
        oracle = IOracle(_oracle);
        loanManager = ILoanManager(_loanManager);
        
        // Initialize default risk weights for new tokens
        // DOT: 85 (high quality L1)
        // WBTC: 90 (highly liquid, blue chip)
        // RWA: 80 (stable but less liquid)
        // Default: 70 (conservative default)
    }
    
    /// Set AI Risk Predictor address
    function setAIPredictor(address _aiPredictor) external onlyOwner {
        aiPredictor = IAIRiskPredictor(_aiPredictor);
    }
    
    /// Set XCM Bridge address
    function setXCMBridge(address _xcmBridge) external onlyOwner {
        xcmBridge = IXCMBridge(_xcmBridge);
    }

    /// Set weight for an asset (example: RWA safer than ETH)
    function setAssetWeight(address token, uint256 weight) external onlyOwner {
        require(weight <= 100, "Weight max 100");
        assetWeights[token] = weight;
        emit WeightUpdated(token, weight);
    }

    /// 📊 Calculate total collateral value (risk-adjusted)
    function getTotalCollateralValue(address user)
        public
        view
        returns (uint256 totalValue)
    {
        address[] memory tokens = vault.getUserTokens(user);

        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 amount = vault.getCollateral(user, tokens[i]);
            uint256 price = oracle.getPrice(tokens[i]);
            uint256 weight = assetWeights[tokens[i]];

            // Weighted risk-adjusted value: (amount * price) * (weight/100)
            totalValue += (amount * price * weight) / (1e18 * 100);
        }
        
        // Add cross-chain collateral if bridge is set
        if (address(xcmBridge) != address(0)) {
            totalValue += getCrossChainCollateralValue(user);
        }
    }
    
    /// 🌉 Get total cross-chain collateral value
    function getCrossChainCollateralValue(address user) public view returns (uint256 totalValue) {
        if (address(xcmBridge) == address(0)) return 0;
        
        // Sum collateral from all supported chains
        for (uint i = 0; i < 5; i++) {
            IXCMBridge.Chain chain = IXCMBridge.Chain(i);
            uint256 amount = crossChainCollateral[user][chain];
            if (amount > 0) {
                // Apply cross-chain discount factor (95% to account for bridge risk)
                totalValue += (amount * 95) / 100;
            }
        }
    }
    
    /// 🔗 Update cross-chain collateral balance
    function updateCrossChainCollateral(
        address user, 
        IXCMBridge.Chain chain, 
        uint256 amount
    ) external {
        require(msg.sender == address(xcmBridge) || msg.sender == owner(), "Only bridge or owner");
        crossChainCollateral[user][chain] = amount;
    }
    
    /// 🎯 Calculate diversification score (0-100)
    function getDiversificationScore(address user) public view returns (uint256) {
        address[] memory tokens = vault.getUserTokens(user);
        if (tokens.length == 0) return 0;
        if (tokens.length == 1) return 30; // Single asset = low diversification
        
        uint256 totalValue = getTotalCollateralValue(user);
        if (totalValue == 0) return 0;
        
        // Calculate concentration (higher = less diversified)
        uint256 maxConcentration = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 amount = vault.getCollateral(user, tokens[i]);
            uint256 price = oracle.getPrice(tokens[i]);
            uint256 value = (amount * price) / 1e18;
            uint256 concentration = (value * 100) / totalValue;
            if (concentration > maxConcentration) {
                maxConcentration = concentration;
            }
        }
        
        // Convert to diversification score (inverse of concentration)
        // 100% in one asset = 0 score, evenly distributed = 100 score
        return 100 - maxConcentration;
    }

    /// 💪 Calculate Health Factor
    /// Health Factor = (Collateral Value * Liquidation Threshold) / Debt
    /// > 1.5 = Safe | 1.0-1.5 = Warning | < 1.0 = Liquidation Risk
    function getHealthFactor(address user) public view returns (uint256) {
        uint256 collateralValue = getTotalCollateralValue(user);
        uint256 userDebt = loanManager.debt(user);

        if (userDebt == 0) return type(uint256).max; // No debt = infinite health

        // Health Factor = (collateral * threshold) / debt
        // Multiply by 100 for precision
        uint256 healthFactor = (collateralValue * LIQUIDATION_THRESHOLD) /
            userDebt;

        return healthFactor;
    }

    /// 🎯 Calculate max borrowable amount
    function getMaxBorrowAmount(address user) external view returns (uint256) {
        uint256 collateralValue = getTotalCollateralValue(user);
        return (collateralValue * MAX_LTV) / 100;
    }

    /// 🚨 Check if user is at liquidation risk
    function isLiquidationRisk(address user) public view returns (bool) {
        uint256 healthFactor = getHealthFactor(user);
        return healthFactor < 100; // Less than 100% = liquidation risk
    }

    /// 🔄 AUTOMATIC MODE SWITCHING with AI integration
    /// Based on: Market volatility + Borrower reliability + Health Factor + Time + AI Prediction
    function autoUpdateMode(address user) external {
        uint256 volatility = oracle.marketVolatility();
        bool isReliable = loanManager.isReliableBorrower(user);
        uint256 healthFactor = getHealthFactor(user);
        uint256 loanDuration = loanManager.getLoanDuration(user);

        Mode newMode;
        string memory reason;
        
        // Get AI risk prediction if available
        IAIRiskPredictor.RiskLevel aiRisk = IAIRiskPredictor.RiskLevel.Low;
        if (address(aiPredictor) != address(0)) {
            uint256 diversification = getDiversificationScore(user);
            aiRisk = aiPredictor.predictUserRisk(user, healthFactor, diversification);
        }

        // 🔴 FREEZE MODE - Emergency protection
        if (volatility > 80 || healthFactor < 100 || aiRisk == IAIRiskPredictor.RiskLevel.Critical) {
            newMode = Mode.Freeze;
            reason = "High volatility, liquidation risk, or AI critical alert";
        }
        // 🟡 CONSERVATIVE MODE - Risk reduction
        else if (
            volatility > 50 ||
            healthFactor < SAFE_THRESHOLD ||
            (!isReliable && loanDuration > 30) ||
            aiRisk == IAIRiskPredictor.RiskLevel.High
        ) {
            newMode = Mode.Conservative;
            reason = "Medium risk detected by market or AI analysis";
        }
        // 🟢 FLEXIBLE MODE - Normal operations
        else {
            // Reliable borrowers get flexible mode even in slight volatility
            if (isReliable || loanDuration < 7) {
                newMode = Mode.Flexible;
                reason = "Low risk or reliable borrower";
            } else {
                newMode = Mode.Conservative;
                reason = "Standard protection";
            }
        }

        // Only update if mode changed
        if (userMode[user] != newMode) {
            userMode[user] = newMode;
            emit ModeUpdated(user, newMode, reason);
        }
    }

    /// 📍 Manual mode update (for testing/override)
    function manualUpdateMode(address user, Mode mode) external onlyOwner {
        userMode[user] = mode;
        emit ModeUpdated(user, mode, "Manual override");
    }

    /// 👀 View functions
    function getMode(address user) external view returns (Mode) {
        return userMode[user];
    }

    function getUserRiskProfile(address user)
        external
        view
        returns (
            uint256 collateralValue,
            uint256 debtAmount,
            uint256 healthFactor,
            Mode mode,
            bool isReliable
        )
    {
        collateralValue = getTotalCollateralValue(user);
        debtAmount = loanManager.debt(user);
        healthFactor = getHealthFactor(user);
        mode = userMode[user];
        isReliable = loanManager.isReliableBorrower(user);
    }
}
