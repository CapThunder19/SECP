// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../vault/SmartVault.sol";
import "../vault/CollateralManager.sol";
import "../protection/AntiLiquidation.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// 🔄 ADAPTIVE REBALANCER
/// Automatically adjusts collateral composition based on market conditions
contract Rebalancer is Ownable {
    SmartVault public vault;
    CollateralManager public manager;
    AntiLiquidation public protection;

    // Asset categories
    mapping(address => AssetType) public assetTypes;

    enum AssetType {
        Stable, // USDC, DAI
        RWA, // Real-world assets
        Yield, // Yield-bearing
        Volatile // ETH, volatile tokens
    }

    // Rebalancing history
    struct RebalanceRecord {
        uint256 timestamp;
        uint8 mode;
        string action;
    }

    mapping(address => RebalanceRecord[]) public rebalanceHistory;

    // Settings
    bool public autoRebalanceEnabled = true;
    uint256 public rebalanceCooldown = 1 hours;
    mapping(address => uint256) public lastRebalance;

    event Rebalanced(address indexed user, string action);
    event ProtectionActivated(address indexed user, string reason);
    event AssetTypeSet(address indexed token, AssetType assetType);
    event ModeTriggered(address indexed user, uint8 mode);

    constructor(
        address _vault,
        address _manager,
        address _protection
    ) Ownable(msg.sender) {
        vault = SmartVault(_vault);
        manager = CollateralManager(_manager);
        protection = AntiLiquidation(_protection);
    }

    /// 🏷️ Set asset type for token
    function setAssetType(address token, AssetType assetType)
        external
        onlyOwner
    {
        assetTypes[token] = assetType;
        emit AssetTypeSet(token, assetType);
    }

    /// 🎯 Main rebalance function (AUTO-TRIGGERED)
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

        if (mode == CollateralManager.Mode.Flexible) {
            _handleFlexibleMode(user);
        } else if (mode == CollateralManager.Mode.Conservative) {
            _handleConservativeMode(user);
        } else if (mode == CollateralManager.Mode.Freeze) {
            _handleFreezeMode(user);
        }

        // Record rebalance
        rebalanceHistory[user].push(
            RebalanceRecord({
                timestamp: block.timestamp,
                mode: uint8(mode),
                action: _getModeString(mode)
            })
        );

        emit ModeTriggered(user, uint8(mode));
    }

    /// 🟢 FLEXIBLE MODE - Normal operations
    function _handleFlexibleMode(address user) internal {
        // No heavy action needed
        // User can manage their own collateral
        emit Rebalanced(user, "Flexible: Normal operations");
    }

    /// 🟡 CONSERVATIVE MODE - Risk reduction
    function _handleConservativeMode(address user) internal {
        // GOAL: Shift risky assets → safer assets
        address[] memory tokens = vault.getUserTokens(user);

        uint256 volatileCount = 0;
        uint256 stableCount = 0;

        // Analyze current composition
        for (uint256 i = 0; i < tokens.length; i++) {
            if (assetTypes[tokens[i]] == AssetType.Volatile) {
                volatileCount++;
            } else if (
                assetTypes[tokens[i]] == AssetType.Stable ||
                assetTypes[tokens[i]] == AssetType.RWA
            ) {
                stableCount++;
            }
        }

        // ACTION: If too much volatile exposure, flag for rebalancing
        // In production: Execute actual swaps via DEX
        // For hackathon: Log the intent
        if (volatileCount > stableCount) {
            emit Rebalanced(
                user,
                "Conservative: High volatile exposure detected - rebalancing recommended"
            );

            // TODO: Implement DEX swap logic here
            // Example: Swap 50% of volatile → stable
        } else {
            emit Rebalanced(user, "Conservative: Composition acceptable");
        }
    }

    /// 🔴 FREEZE MODE - Emergency protection
    function _handleFreezeMode(address user) internal {
        // CRITICAL: Activate anti-liquidation protection
        if (!protection.isProtected(user)) {
            protection.activate(user, "Market crash - freeze mode activated");

            emit ProtectionActivated(
                user,
                "Anti-liquidation vault activated"
            );
        }

        emit Rebalanced(user, "Freeze: Protection mode active");
    }

    /// 🚨 Emergency rebalance (manual override)
    function emergencyRebalance(address user) external onlyOwner {
        manager.manualUpdateMode(user, CollateralManager.Mode.Freeze);
        _handleFreezeMode(user);
    }

    /// 📊 Get rebalancing suggestions (view function)
    function getRebalanceSuggestion(address user)
        external
        view
        returns (
            string memory action,
            uint256 volatileExposure,
            uint256 safeExposure
        )
    {
        address[] memory tokens = vault.getUserTokens(user);

        uint256 totalVolatile;
        uint256 totalSafe;

        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 amount = vault.getCollateral(user, tokens[i]);

            if (assetTypes[tokens[i]] == AssetType.Volatile) {
                totalVolatile += amount;
            } else {
                totalSafe += amount;
            }
        }

        if (totalVolatile > totalSafe * 2) {
            action = "Reduce volatile exposure by 50%";
        } else if (totalVolatile > totalSafe) {
            action = "Reduce volatile exposure by 25%";
        } else {
            action = "Portfolio balanced";
        }

        volatileExposure = totalVolatile;
        safeExposure = totalSafe;
    }

    /// 🔧 Settings
    function setAutoRebalance(bool enabled) external onlyOwner {
        autoRebalanceEnabled = enabled;
    }

    function setCooldown(uint256 duration) external onlyOwner {
        rebalanceCooldown = duration;
    }

    /// 👀 View functions
    function getRebalanceHistory(address user)
        external
        view
        returns (RebalanceRecord[] memory)
    {
        return rebalanceHistory[user];
    }

    function canRebalance(address user) external view returns (bool) {
        return block.timestamp >= lastRebalance[user] + rebalanceCooldown;
    }

    function _getModeString(CollateralManager.Mode mode)
        internal
        pure
        returns (string memory)
    {
        if (mode == CollateralManager.Mode.Flexible) return "Flexible";
        if (mode == CollateralManager.Mode.Conservative) return "Conservative";
        if (mode == CollateralManager.Mode.Freeze) return "Freeze";
        return "Unknown";
    }
}
