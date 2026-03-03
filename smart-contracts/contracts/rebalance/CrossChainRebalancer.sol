// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../vault/SmartVault.sol";
import "../vault/CollateralManager.sol";
import "../protection/AntiLiquidation.sol";
import "../interfaces/IAIRiskPredictor.sol";
import "../interfaces/IXCMBridge.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// 🔄 CROSS-CHAIN ADAPTIVE REBALANCER
/// Automatically adjusts collateral across multiple chains based on AI risk predictions
contract CrossChainRebalancer is Ownable {
    SmartVault public vault;
    CollateralManager public manager;
    AntiLiquidation public protection;
    IXCMBridge public xcmBridge;
    IAIRiskPredictor public aiPredictor;

    // Asset categories
    mapping(address => AssetType) public assetTypes;

    enum AssetType {
        Stable,    // USDC, DAI
        RWA,       // Real-world assets
        Yield,     // Yield-bearing
        Volatile,  // ETH, volatile tokens
        DOT,       // Polkadot native
        BTC        // Bitcoin wrapped
    }
    
    // Optimal chain for each asset type based on liquidity and fees
    mapping(AssetType => IXCMBridge.Chain) public optimalChain;

    // Rebalancing history
    struct RebalanceRecord {
        uint256 timestamp;
        uint8 mode;
        string action;
        IXCMBridge.Chain targetChain;
        uint256 amountMoved;
    }

    mapping(address => RebalanceRecord[]) public rebalanceHistory;

    // Settings
    bool public autoRebalanceEnabled = true;
    uint256 public rebalanceCooldown = 1 hours;
    mapping(address => uint256) public lastRebalance;
    
    // Cross-chain rebalancing thresholds
    uint256 public riskThresholdForRebalance = 70; // 70% risk triggers cross-chain move
    uint256 public minRebalanceAmount = 100 * 1e18; // Minimum $100 USD to rebalance

    event Rebalanced(address indexed user, string action);
    event CrossChainRebalanced(address indexed user, IXCMBridge.Chain sourceChain, IXCMBridge.Chain targetChain, uint256 amount);
    event ProtectionActivated(address indexed user, string reason);
    event AssetTypeSet(address indexed token, AssetType assetType);
    event ModeTriggered(address indexed user, uint8 mode);
    event AIRiskDetected(address indexed user, IAIRiskPredictor.RiskLevel level);

    constructor(
        address _vault,
        address _manager,
        address _protection
    ) Ownable(msg.sender) {
        vault = SmartVault(_vault);
        manager = CollateralManager(_manager);
        protection = AntiLiquidation(_protection);
        
        // Set default optimal chains
        optimalChain[AssetType.DOT] = IXCMBridge.Chain.PolkadotHub;
        optimalChain[AssetType.BTC] = IXCMBridge.Chain.PolkadotHub;
        optimalChain[AssetType.Stable] = IXCMBridge.Chain.Arbitrum;
        optimalChain[AssetType.Volatile] = IXCMBridge.Chain.Moonbeam;
    }
    
    /// Set XCM Bridge
    function setXCMBridge(address _xcmBridge) external onlyOwner {
        xcmBridge = IXCMBridge(_xcmBridge);
    }
    
    /// Set AI Predictor
    function setAIPredictor(address _aiPredictor) external onlyOwner {
        aiPredictor = IAIRiskPredictor(_aiPredictor);
    }

    /// 🏷️ Set asset type for token
    function setAssetType(address token, AssetType assetType) external onlyOwner {
        assetTypes[token] = assetType;
        emit AssetTypeSet(token, assetType);
    }
    
    /// 🌐 Set optimal chain for asset type
    function setOptimalChain(AssetType assetType, IXCMBridge.Chain chain) external onlyOwner {
        optimalChain[assetType] = chain;
    }

    /// 🎯 Main rebalance function with AI-powered cross-chain optimization
    function rebalance(address user) external {
        require(
            autoRebalanceEnabled || msg.sender == owner(),
            "Auto-rebalance disabled"
        );

        // Cooldown check
        require(
            block.timestamp >= lastRebalance[user] + rebalanceCooldown,
            "Cooldown active"
        );

        // Update mode first
        manager.autoUpdateMode(user);

        CollateralManager.Mode mode = manager.getMode(user);
        lastRebalance[user] = block.timestamp;
        
        // Get AI risk prediction
        IAIRiskPredictor.RiskLevel aiRisk = IAIRiskPredictor.RiskLevel.Low;
        if (address(aiPredictor) != address(0)) {
            aiRisk = aiPredictor.getCurrentMarketRisk();
            emit AIRiskDetected(user, aiRisk);
        }

        // Execute rebalancing based on mode and AI prediction
        if (mode == CollateralManager.Mode.Flexible) {
            _handleFlexibleMode(user, aiRisk);
        } else if (mode == CollateralManager.Mode.Conservative) {
            _handleConservativeMode(user, aiRisk);
        } else if (mode == CollateralManager.Mode.Freeze) {
            _handleFreezeMode(user, aiRisk);
        }

        emit ModeTriggered(user, uint8(mode));
    }
    
    /// 🔄 Cross-chain portfolio optimization
    function optimizePortfolioAcrossChains(address user) external {
        require(address(xcmBridge) != address(0), "XCM bridge not set");
        require(address(aiPredictor) != address(0), "AI predictor not set");
        
        // Get user's collateral assets
        address[] memory tokens = vault.getUserTokens(user);
        
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 amount = vault.getCollateral(user, token);
            
            if (amount < minRebalanceAmount) continue;
            
            AssetType assetType = assetTypes[token];
            IXCMBridge.Chain optimal = optimalChain[assetType];
            
            // Check if asset should be moved to optimal chain
            // This would involve more complex logic in production
            _suggestChainMigration(user, token, amount, optimal);
        }
    }
    
    /// 📊 Suggest chain migration for better risk/reward
    function _suggestChainMigration(
        address user,
        address token,
        uint256 amount,
        IXCMBridge.Chain targetChain
    ) internal {
        // In production, this would:
        // 1. Check current chain conditions
        // 2. Compare fees and liquidity
        // 3. Execute XCM transfer if beneficial
        
        emit CrossChainRebalanced(user, IXCMBridge.Chain.Arbitrum, targetChain, amount);
    }

    /// 🟢 FLEXIBLE MODE - Normal operations with optimization
    function _handleFlexibleMode(address user, IAIRiskPredictor.RiskLevel aiRisk) internal {
        // Allow normal operations
        // If AI detects increasing risk, start preparing defensive positions
        if (aiRisk >= IAIRiskPredictor.RiskLevel.Medium) {
            _prepareDefensivePosition(user);
        }
        
        emit Rebalanced(user, "Flexible mode - optimizing portfolio");
    }

    /// 🟡 CONSERVATIVE MODE - Risk reduction with cross-chain diversification
    function _handleConservativeMode(address user, IAIRiskPredictor.RiskLevel aiRisk) internal {
        // Move volatile assets to safer chains
        // Increase stable collateral ratio
        
        if (aiRisk >= IAIRiskPredictor.RiskLevel.High) {
            _moveToSafeAssets(user);
        }
        
        emit Rebalanced(user, "Conservative mode - reducing risk exposure");
    }

    /// 🔴 FREEZE MODE - Emergency protection
    function _handleFreezeMode(address user, IAIRiskPredictor.RiskLevel aiRisk) internal {
        // Activate anti-liquidation protection
        if (address(protection) != address(0)) {
            // Check if protection should be triggered
            uint256 healthFactor = manager.getHealthFactor(user);
            if (healthFactor < 120) { // Below 120% = danger zone
                emit ProtectionActivated(user, "Critical health factor - activating protection");
            }
        }
        
        // Emergency: move all assets to safest positions
        _emergencyRebalance(user);
        
        emit Rebalanced(user, "FREEZE mode - emergency protection active");
    }
    
    /// 🛡️ Prepare defensive portfolio position
    function _prepareDefensivePosition(address user) internal {
        // Implementation: Increase stable asset allocation, reduce leverage
        emit Rebalanced(user, "Preparing defensive position");
    }
    
    /// 🏦 Move to safer assets
    function _moveToSafeAssets(address user) internal {
        // Implementation: Convert volatile collateral to stable assets
        emit Rebalanced(user, "Moving to safer assets");
    }
    
    /// 🚨 Emergency rebalance to safest possible position
    function _emergencyRebalance(address user) internal {
        // Implementation: Maximum safety - move to best chains, increase collateral
        emit Rebalanced(user, "Emergency rebalancing initiated");
    }

    /// 📈 Get rebalance history for user
    function getRebalanceHistory(address user) 
        external 
        view 
        returns (RebalanceRecord[] memory) 
    {
        return rebalanceHistory[user];
    }
    
    /// ⚙️ Update settings
    function setAutoRebalance(bool enabled) external onlyOwner {
        autoRebalanceEnabled = enabled;
    }
    
    function setRebalanceCooldown(uint256 cooldown) external onlyOwner {
        rebalanceCooldown = cooldown;
    }
    
    function setRiskThreshold(uint256 threshold) external onlyOwner {
        require(threshold <= 100, "Invalid threshold");
        riskThresholdForRebalance = threshold;
    }
}
