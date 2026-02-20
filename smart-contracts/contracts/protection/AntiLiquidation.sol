// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../vault/SmartVault.sol";
import "../lending/LoanManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// 🛡️ ANTI-LIQUIDATION VAULT
/// Last-resort protection mechanism during extreme market crashes
contract AntiLiquidation is Ownable {
    SmartVault public vault;
    LoanManager public loanManager;

    mapping(address => bool) public protection;
    mapping(address => uint256) public protectionActivatedAt;
    mapping(address => uint256) public slowRepayAmount; // Tracks slow repayment

    // Protection settings
    uint256 public protectionDuration = 7 days; // Default protection period
    uint256 public slowRepayRate = 10; // 10% per period

    // Authorized callers (rebalancer, automation)
    mapping(address => bool) public authorized;

    event ProtectionActivated(address indexed user, string reason);
    event ProtectionDeactivated(address indexed user);
    event SlowRepayment(address indexed user, uint256 amount);
    event VaultFrozen(address indexed user);
    event VaultUnfrozen(address indexed user);

    constructor(
        address _vault,
        address _loanManager
    ) Ownable(msg.sender) {
        vault = SmartVault(_vault);
        loanManager = LoanManager(_loanManager);
    }

    /// 🔐 Add authorized caller (Rebalancer, automation bots)
    function addAuthorized(address account) external onlyOwner {
        authorized[account] = true;
    }

    function removeAuthorized(address account) external onlyOwner {
        authorized[account] = false;
    }

    modifier onlyAuthorized() {
        require(
            authorized[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    /// 🚨 Activate protection mode
    function activate(address user, string calldata reason)
        external
        onlyAuthorized
    {
        require(!protection[user], "Already protected");

        protection[user] = true;
        protectionActivatedAt[user] = block.timestamp;

        // Freeze vault to prevent withdrawals
        vault.freezeVault(user);

        emit ProtectionActivated(user, reason);
        emit VaultFrozen(user);
    }

    /// ✅ Deactivate protection (when crisis is over)
    function deactivate(address user) external onlyAuthorized {
        require(protection[user], "Not in protection");

        protection[user] = false;

        // Unfreeze vault
        vault.unfreezeVault(user);

        emit ProtectionDeactivated(user);
        emit VaultUnfrozen(user);
    }

    /// Internal deactivation (to avoid external modifier check in automated flow)
    function _deactivateInternal(address user) internal {
        protection[user] = false;
        vault.unfreezeVault(user);
        emit ProtectionDeactivated(user);
        emit VaultUnfrozen(user);
    }

    /// 💸 Slow repayment mechanism
    /// Gradually repays debt instead of forced liquidation
    function executeSlowRepay(address user) external onlyAuthorized {
        require(protection[user], "Not in protection");

        uint256 userDebt = loanManager.debt(user);
        require(userDebt > 0, "No debt");

        // Calculate repayment amount (10% of remaining debt per call)
        uint256 repayAmount = (userDebt * slowRepayRate) / 100;

        // Minimum 1% to ensure progress
        if (repayAmount == 0 && userDebt > 0) {
            repayAmount = userDebt / 100;
        }

        // Ensure we don't overpay
        if (repayAmount > userDebt) {
            repayAmount = userDebt;
        }

        // Track slow repayment
        slowRepayAmount[user] += repayAmount;

        // Execute repayment
        loanManager.repayFromProtection(user, repayAmount);

        emit SlowRepayment(user, repayAmount);

        // If fully repaid, deactivate protection
        if (loanManager.debt(user) == 0) {
            _deactivateInternal(user);
        }
    }

    /// ⏱️ Check if protection period expired
    function isProtectionExpired(address user) public view returns (bool) {
        if (!protection[user]) return false;
        return block.timestamp >
            (protectionActivatedAt[user] + protectionDuration);
    }

    /// 🔧 Update settings
    function setProtectionDuration(uint256 duration) external onlyOwner {
        protectionDuration = duration;
    }

    function setSlowRepayRate(uint256 rate) external onlyOwner {
        require(rate <= 100, "Invalid rate");
        slowRepayRate = rate;
    }

    /// 👀 View functions
    function isProtected(address user) external view returns (bool) {
        return protection[user];
    }

    function getProtectionInfo(address user)
        external
        view
        returns (
            bool isActive,
            uint256 activatedAt,
            uint256 expiresAt,
            uint256 totalSlowRepaid
        )
    {
        isActive = protection[user];
        activatedAt = protectionActivatedAt[user];
        expiresAt = activatedAt + protectionDuration;
        totalSlowRepaid = slowRepayAmount[user];
    }
}
