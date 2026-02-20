// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILoanManager {
    function debt(address user) external view returns (uint256);
    function repayFromProtection(address user, uint256 amount) external;
}

interface ICollateralManager {
    function getMode(address user) external view returns (uint8);
}

/// 💰 YIELD DIVERSION ENGINE
/// Automatically routes yield from collateral to protect loans
contract YieldManager is Ownable {
    struct YieldSource {
        address token; // Yield-bearing token
        uint256 totalYield; // Accumulated yield
        uint256 lastUpdate;
    }

    // user => yield data
    mapping(address => YieldSource) public userYield;

    // Yield token addresses (e.g., stETH, aUSDC)
    mapping(address => bool) public isYieldToken;
    mapping(address => uint256) public yieldRate; // Annual yield rate (in basis points)

    ILoanManager public loanManager;
    ICollateralManager public collateralManager;

    // Protection mode settings
    bool public autoProtectionEnabled = true;
    uint256 public protectionThreshold = 80; // Activate at 80% health factor

    event YieldAccrued(address indexed user, uint256 amount);
    event YieldDiverted(address indexed user, uint256 amount, string reason);
    event YieldWithdrawn(address indexed user, uint256 amount);
    event YieldTokenAdded(address indexed token, uint256 rate);

    constructor(
        address _loanManager,
        address _collateralManager
    ) Ownable(msg.sender) {
        loanManager = ILoanManager(_loanManager);
        collateralManager = ICollateralManager(_collateralManager);
    }

    /// 🔧 Add yield-bearing token
    function addYieldToken(address token, uint256 annualRate)
        external
        onlyOwner
    {
        isYieldToken[token] = true;
        yieldRate[token] = annualRate; // e.g., 500 = 5% APY
        emit YieldTokenAdded(token, annualRate);
    }

    /// 📈 Accrue yield for user (called periodically or on-demand)
    function accrueYield(address user, address token) public {
        require(isYieldToken[token], "Not a yield token");

        YieldSource storage source = userYield[user];
        uint256 timeElapsed = block.timestamp - source.lastUpdate;

        if (timeElapsed == 0) return;

        // Simple yield calculation: principal * rate * time / 365 days / 10000
        // In real protocol, query actual yield from lending protocol
        uint256 principal = IERC20(token).balanceOf(address(this)); // Simplified
        uint256 yield = (principal * yieldRate[token] * timeElapsed) /
            (365 days * 10000);

        source.totalYield += yield;
        source.lastUpdate = block.timestamp;
        source.token = token;

        emit YieldAccrued(user, yield);
    }

    /// 🛡️ AUTO-DIVERT yield to loan repayment in crisis
    function autoDivertYield(address user) external {
        require(autoProtectionEnabled, "Auto-protection disabled");

        // Check if user is in Conservative or Freeze mode
        uint8 mode = collateralManager.getMode(user);
        require(mode >= 1, "User not in protection mode"); // 1=Conservative, 2=Freeze

        YieldSource storage source = userYield[user];
        uint256 availableYield = source.totalYield;

        require(availableYield > 0, "No yield available");

        // Get user debt
        uint256 userDebt = loanManager.debt(user);

        if (userDebt == 0) return; // No debt to repay

        // Divert yield to loan repayment
        uint256 repayAmount = availableYield > userDebt
            ? userDebt
            : availableYield;

        source.totalYield -= repayAmount;

        // Repay loan using diverted yield
        loanManager.repayFromProtection(user, repayAmount);

        emit YieldDiverted(user, repayAmount, "Auto-protection activated");
    }

    /// 💸 Manual yield withdrawal (only in Flexible mode)
    function withdrawYield(uint256 amount) external {
        uint8 mode = collateralManager.getMode(msg.sender);
        require(mode == 0, "Withdrawals locked in protection mode");

        YieldSource storage source = userYield[msg.sender];
        require(source.totalYield >= amount, "Insufficient yield");

        source.totalYield -= amount;

        // Transfer yield token to user
        IERC20(source.token).transfer(msg.sender, amount);

        emit YieldWithdrawn(msg.sender, amount);
    }

    /// 🔄 Emergency divert (manual trigger)
    function emergencyDivert(address user) external onlyOwner {
        YieldSource storage source = userYield[user];
        uint256 availableYield = source.totalYield;

        require(availableYield > 0, "No yield");

        uint256 userDebt = loanManager.debt(user);
        uint256 repayAmount = availableYield > userDebt
            ? userDebt
            : availableYield;

        source.totalYield -= repayAmount;
        loanManager.repayFromProtection(user, repayAmount);

        emit YieldDiverted(user, repayAmount, "Emergency diversion");
    }

    /// ⚙️ Settings
    function setAutoProtection(bool enabled) external onlyOwner {
        autoProtectionEnabled = enabled;
    }

    function setProtectionThreshold(uint256 threshold) external onlyOwner {
        require(threshold <= 100, "Invalid threshold");
        protectionThreshold = threshold;
    }

    /// 👀 View functions
    function getYieldBalance(address user) external view returns (uint256) {
        return userYield[user].totalYield;
    }

    function canWithdrawYield(address user) external view returns (bool) {
        uint8 mode = collateralManager.getMode(user);
        return mode == 0 && userYield[user].totalYield > 0;
    }

    function estimateYield(
        address /* user */,
        address token,
        uint256 duration
    ) external view returns (uint256) {
        uint256 principal = IERC20(token).balanceOf(address(this));
        return (principal * yieldRate[token] * duration) / (365 days * 10000);
    }
}
