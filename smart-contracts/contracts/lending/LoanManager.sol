// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LoanManager is Ownable {
    // 🧠 BORROWER MEMORY - Track user behavior
    struct BorrowerHistory {
        uint256 totalBorrowed;
        uint256 totalRepaid;
        uint256 liquidationCount;
        uint256 onTimeRepayments;
        uint256 lateRepayments;
        uint256 lastLoanTimestamp;
        bool isReliable; // Auto-calculated based on history
    }

    // ⏰ TIME-AWARE - Track loan duration
    struct Loan {
        uint256 amount;
        uint256 startTime;
        uint256 duration; // Expected duration in seconds
        bool isActive;
    }

    // State variables
    mapping(address => uint256) public debt;
    mapping(address => BorrowerHistory) public borrowerHistory;
    mapping(address => Loan) public activeLoan;

    address public collateralManager;
    address public antiLiquidation;
    IERC20 public loanToken; // Token being borrowed (e.g., USDC)

    // Reliability threshold
    uint256 public constant RELIABILITY_THRESHOLD = 80; // 80% on-time = reliable

    event Borrow(address indexed user, uint256 amount, uint256 duration);
    event Repay(address indexed user, uint256 amount, bool onTime);
    event ReliabilityUpdated(address indexed user, bool isReliable);
    event LiquidationRecorded(address indexed user);

    constructor(address _loanToken) Ownable(msg.sender) {
        loanToken = IERC20(_loanToken);
    }

    function setCollateralManager(address _manager) external onlyOwner {
        collateralManager = _manager;
    }

    function setAntiLiquidation(address _protection) external onlyOwner {
        antiLiquidation = _protection;
    }

    /// 📊 Borrow with time-awareness
    function borrow(uint256 amount, uint256 durationDays) external {
        require(amount > 0, "Invalid amount");
        require(!activeLoan[msg.sender].isActive, "Active loan exists");

        // Record loan
        debt[msg.sender] += amount;
        activeLoan[msg.sender] = Loan({
            amount: amount,
            startTime: block.timestamp,
            duration: durationDays * 1 days,
            isActive: true
        });

        // Update history
        borrowerHistory[msg.sender].totalBorrowed += amount;
        borrowerHistory[msg.sender].lastLoanTimestamp = block.timestamp;

        // Transfer loan tokens to borrower
        loanToken.transfer(msg.sender, amount);

        emit Borrow(msg.sender, amount, durationDays);
    }

    /// 💸 Repay with behavior tracking
    function repay(uint256 amount) external {
        require(debt[msg.sender] >= amount, "Repay exceeds debt");

        // Transfer tokens from borrower
        loanToken.transferFrom(msg.sender, address(this), amount);

        debt[msg.sender] -= amount;

        // Track repayment behavior
        Loan storage loan = activeLoan[msg.sender];
        bool onTime = block.timestamp <= (loan.startTime + loan.duration);

        BorrowerHistory storage history = borrowerHistory[msg.sender];
        history.totalRepaid += amount;

        if (onTime) {
            history.onTimeRepayments++;
        } else {
            history.lateRepayments++;
        }

        // If fully repaid, close loan
        if (debt[msg.sender] == 0) {
            loan.isActive = false;
            _updateReliability(msg.sender);
        }

        emit Repay(msg.sender, amount, onTime);
    }

    /// 🛡️ Repay from protection system (Anti-Liquidation)
    function repayFromProtection(address user, uint256 amount) external {
        require(
            msg.sender == antiLiquidation || msg.sender == owner(),
            "Unauthorized"
        );
        require(debt[user] >= amount, "Repay exceeds debt");

        debt[user] -= amount;

        // Close loan if fully repaid
        if (debt[user] == 0) {
            activeLoan[user].isActive = false;
        }
    }

    /// 📉 Record liquidation event
    function recordLiquidation(address user) external {
        require(msg.sender == collateralManager, "Only manager");

        borrowerHistory[user].liquidationCount++;
        borrowerHistory[user].isReliable = false; // Immediate penalty

        emit LiquidationRecorded(user);
    }

    /// 🧠 Calculate and update reliability
    function _updateReliability(address user) internal {
        BorrowerHistory storage history = borrowerHistory[user];

        uint256 totalRepayments = history.onTimeRepayments +
            history.lateRepayments;

        if (totalRepayments == 0) {
            history.isReliable = true; // New user, give benefit of doubt
            return;
        }

        // Calculate reliability percentage
        uint256 reliabilityScore = (history.onTimeRepayments * 100) /
            totalRepayments;

        // Penalty for liquidations
        if (history.liquidationCount > 0) {
            reliabilityScore =
                reliabilityScore /
                (history.liquidationCount + 1);
        }

        history.isReliable = reliabilityScore >= RELIABILITY_THRESHOLD;

        emit ReliabilityUpdated(user, history.isReliable);
    }

    /// 📊 View functions
    function isReliableBorrower(address user) external view returns (bool) {
        return borrowerHistory[user].isReliable;
    }

    function getLoanDuration(address user) external view returns (uint256) {
        return activeLoan[user].duration / 1 days;
    }

    function isLoanExpired(address user) external view returns (bool) {
        Loan memory loan = activeLoan[user];
        if (!loan.isActive) return false;
        return block.timestamp > (loan.startTime + loan.duration);
    }

    function getBorrowerScore(address user) external view returns (uint256) {
        BorrowerHistory memory history = borrowerHistory[user];
        uint256 total = history.onTimeRepayments + history.lateRepayments;

        if (total == 0) return 100; // New user

        uint256 score = (history.onTimeRepayments * 100) / total;

        // Penalty for liquidations
        if (history.liquidationCount > 0) {
            score = score / (history.liquidationCount + 1);
        }

        return score;
    }
}
