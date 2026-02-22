// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LoanManager is Ownable {
    struct BorrowerHistory {
        uint256 totalBorrowed;
        uint256 totalRepaid;
        uint256 liquidationCount;
        uint256 onTimeRepayments;
        uint256 lateRepayments;
        uint256 lastLoanTimestamp;
        bool isReliable;
    }

    struct Loan {
        uint256 amount;
        uint256 startTime;
        uint256 duration;
        bool isActive;
    }

    mapping(address => uint256) public debt;
    mapping(address => BorrowerHistory) public borrowerHistory;
    mapping(address => Loan) public activeLoan;

    address public collateralManager;
    address public antiLiquidation;
    IERC20 public loanToken;

    uint256 public constant RELIABILITY_THRESHOLD = 80;

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

    function borrow(uint256 amount, uint256 durationDays) external {
        require(amount > 0, "Invalid amount");
        require(!activeLoan[msg.sender].isActive, "Active loan exists");

        debt[msg.sender] += amount;
        activeLoan[msg.sender] = Loan({
            amount: amount,
            startTime: block.timestamp,
            duration: durationDays * 1 days,
            isActive: true
        });

        borrowerHistory[msg.sender].totalBorrowed += amount;
        borrowerHistory[msg.sender].lastLoanTimestamp = block.timestamp;

        loanToken.transfer(msg.sender, amount);

        emit Borrow(msg.sender, amount, durationDays);
    }

    function repay(uint256 amount) external {
        require(debt[msg.sender] >= amount, "Repay exceeds debt");

        loanToken.transferFrom(msg.sender, address(this), amount);

        debt[msg.sender] -= amount;

        Loan storage loan = activeLoan[msg.sender];
        bool onTime = block.timestamp <= (loan.startTime + loan.duration);

        BorrowerHistory storage history = borrowerHistory[msg.sender];
        history.totalRepaid += amount;

        if (onTime) {
            history.onTimeRepayments++;
        } else {
            history.lateRepayments++;
        }

        if (debt[msg.sender] == 0) {
            loan.isActive = false;
            _updateReliability(msg.sender);
        }

        emit Repay(msg.sender, amount, onTime);
    }

    function repayFromProtection(address user, uint256 amount) external {
        require(
            msg.sender == antiLiquidation || msg.sender == owner(),
            "Unauthorized"
        );
        require(debt[user] >= amount, "Repay exceeds debt");

        debt[user] -= amount;

        if (debt[user] == 0) {
            activeLoan[user].isActive = false;
        }
    }

    function recordLiquidation(address user) external {
        require(msg.sender == collateralManager, "Only manager");

        borrowerHistory[user].liquidationCount++;
        borrowerHistory[user].isReliable = false;

        emit LiquidationRecorded(user);
    }

    function _updateReliability(address user) internal {
        BorrowerHistory storage history = borrowerHistory[user];

        uint256 totalRepayments = history.onTimeRepayments +
            history.lateRepayments;

        if (totalRepayments == 0) {
            history.isReliable = true;
            return;
        }

        uint256 reliabilityScore = (history.onTimeRepayments * 100) /
            totalRepayments;

        if (history.liquidationCount > 0) {
            reliabilityScore =
                reliabilityScore /
                (history.liquidationCount + 1);
        }

        history.isReliable = reliabilityScore >= RELIABILITY_THRESHOLD;

        emit ReliabilityUpdated(user, history.isReliable);
    }

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

        if (total == 0) return 100;

        uint256 score = (history.onTimeRepayments * 100) / total;

        if (history.liquidationCount > 0) {
            score = score / (history.liquidationCount + 1);
        }

        return score;
    }
}
