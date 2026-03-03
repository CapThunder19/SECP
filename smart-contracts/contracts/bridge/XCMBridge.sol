// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title XCMBridge
 * @notice Cross-chain bridge using Polkadot XCM for multi-chain collateral support
 * @dev Enables users to deposit assets from multiple Polkadot parachains
 */
contract XCMBridge is Ownable, ReentrancyGuard {
    
    // Supported chains in the Polkadot ecosystem
    enum Chain {
        PolkadotHub,     // Polkadot Asset Hub (parachain 1000)
        Moonbeam,        // para 2004
        Acala,           // para 2000
        Astar,           // para 2006
        Arbitrum         // External bridged chain
    }

    // Track cross-chain deposits
    struct CrossChainDeposit {
        address user;
        address token;
        uint256 amount;
        Chain sourceChain;
        uint256 timestamp;
        bool processed;
    }

    // Mapping from deposit ID to deposit details
    mapping(bytes32 => CrossChainDeposit) public deposits;
    
    // Track pending transfers
    mapping(address => mapping(Chain => uint256)) public pendingTransfers;
    
    // Whitelisted tokens that can be bridged
    mapping(address => bool) public whitelistedTokens;
    
    // Chain ID mapping for parachains
    mapping(Chain => uint256) public chainIds;
    
    // Total value locked by chain
    mapping(Chain => uint256) public tvlByChain;

    event CrossChainDepositInitiated(
        bytes32 indexed depositId,
        address indexed user,
        address token,
        uint256 amount,
        Chain sourceChain
    );
    
    event CrossChainDepositCompleted(
        bytes32 indexed depositId,
        address indexed user,
        uint256 amount
    );
    
    event CrossChainWithdrawal(
        address indexed user,
        address token,
        uint256 amount,
        Chain destinationChain
    );
    
    event TokenWhitelisted(address indexed token, bool status);

    constructor() Ownable(msg.sender) {
        // Initialize chain IDs for Polkadot parachains
        chainIds[Chain.PolkadotHub] = 1000;
        chainIds[Chain.Moonbeam] = 2004;
        chainIds[Chain.Acala] = 2000;
        chainIds[Chain.Astar] = 2006;
        chainIds[Chain.Arbitrum] = 42161;
    }

    /**
     * @notice Whitelist a token for cross-chain transfers
     */
    function whitelistToken(address token, bool status) external onlyOwner {
        whitelistedTokens[token] = status;
        emit TokenWhitelisted(token, status);
    }

    /**
     * @notice Initiate cross-chain deposit from another parachain
     * @dev This would be called by XCM message handler in production
     */
    function initiateCrossChainDeposit(
        address user,
        address token,
        uint256 amount,
        Chain sourceChain
    ) external nonReentrant returns (bytes32 depositId) {
        require(whitelistedTokens[token], "Token not whitelisted");
        require(amount > 0, "Amount must be > 0");
        
        // Generate unique deposit ID
        depositId = keccak256(
            abi.encodePacked(user, token, amount, sourceChain, block.timestamp)
        );
        
        deposits[depositId] = CrossChainDeposit({
            user: user,
            token: token,
            amount: amount,
            sourceChain: sourceChain,
            timestamp: block.timestamp,
            processed: false
        });
        
        pendingTransfers[user][sourceChain] += amount;
        
        emit CrossChainDepositInitiated(depositId, user, token, amount, sourceChain);
        
        return depositId;
    }

    /**
     * @notice Complete cross-chain deposit (called after XCM message confirmation)
     */
    function completeCrossChainDeposit(bytes32 depositId) external nonReentrant {
        CrossChainDeposit storage deposit = deposits[depositId];
        require(!deposit.processed, "Already processed");
        require(deposit.amount > 0, "Invalid deposit");
        
        deposit.processed = true;
        
        // Update TVL tracking
        tvlByChain[deposit.sourceChain] += deposit.amount;
        
        // Transfer tokens to user
        IERC20(deposit.token).transfer(deposit.user, deposit.amount);
        
        // Update pending transfers
        pendingTransfers[deposit.user][deposit.sourceChain] -= deposit.amount;
        
        emit CrossChainDepositCompleted(depositId, deposit.user, deposit.amount);
    }

    /**
     * @notice Withdraw assets to another parachain
     * @dev Initiates XCM transfer to destination chain
     */
    function withdrawToCrossChain(
        address token,
        uint256 amount,
        Chain destinationChain
    ) external nonReentrant {
        require(whitelistedTokens[token], "Token not whitelisted");
        require(amount > 0, "Amount must be > 0");
        
        // Transfer tokens from user
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Update TVL
        if (tvlByChain[destinationChain] >= amount) {
            tvlByChain[destinationChain] -= amount;
        }
        
        emit CrossChainWithdrawal(msg.sender, token, amount, destinationChain);
        
        // In production, this would trigger XCM message to destination chain
        // For now, tokens are held in bridge contract
    }

    /**
     * @notice Get total value locked across all chains
     */
    function getTotalTVL() external view returns (uint256 total) {
        total = tvlByChain[Chain.PolkadotHub] +
                tvlByChain[Chain.Moonbeam] +
                tvlByChain[Chain.Acala] +
                tvlByChain[Chain.Astar] +
                tvlByChain[Chain.Arbitrum];
    }

    /**
     * @notice Get pending transfers for a user on a specific chain
     */
    function getPendingTransfers(address user, Chain chain) 
        external 
        view 
        returns (uint256) 
    {
        return pendingTransfers[user][chain];
    }

    /**
     * @notice Emergency withdrawal by owner
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}
