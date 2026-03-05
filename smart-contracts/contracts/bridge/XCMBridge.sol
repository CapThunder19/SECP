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
    
    // SmartVault integration for direct collateral deposits
    address public smartVault;
    
    // Supported chains in the Polkadot ecosystem
    enum Chain {
        PolkadotHub,     // Polkadot Asset Hub (parachain 1000)
        Moonbeam,        // para 2004
        Acala,           // para 2000
        Astar,           // para 2006
        Arbitrum,        // External bridged chain
        Sepolia          // Ethereum Sepolia testnet
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
    
    // Token mapping: source chain token -> destination chain token
    // Format: keccak256(sourceChain, sourceToken) -> destToken
    mapping(bytes32 => address) public tokenMapping;
    
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
    
    event TokensLocked(
        bytes32 indexed lockId,
        address indexed user,
        address indexed token,
        uint256 amount,
        Chain destinationChain
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
     * @notice Set SmartVault address for direct collateral deposits
     */
    function setSmartVault(address _smartVault) external onlyOwner {
        smartVault = _smartVault;
    }

    /**
     * @notice Whitelist a token for cross-chain transfers
     */
    function whitelistToken(address token, bool status) external onlyOwner {
        whitelistedTokens[token] = status;
        emit TokenWhitelisted(token, status);
    }

    /**
     * @notice Map tokens between chains (e.g., DOT on Sepolia -> DOT on Moonbase)
     * @param sourceChain Source blockchain
     * @param sourceToken Token address on source chain
     * @param destToken Token address on destination chain
     */
    function setTokenMapping(
        Chain sourceChain,
        address sourceToken,
        address destToken
    ) external onlyOwner {
        bytes32 key = keccak256(abi.encodePacked(uint8(sourceChain), sourceToken));
        tokenMapping[key] = destToken;
    }

    /**
     * @notice Get destination token address for a source token
     */
    function getDestinationToken(Chain sourceChain, address sourceToken) 
        public 
        view 
        returns (address) 
    {
        bytes32 key = keccak256(abi.encodePacked(uint8(sourceChain), sourceToken));
        return tokenMapping[key];
    }

    /**
     * @notice Lock tokens on source chain for cross-chain transfer
     * @dev Called on source chain (e.g., Sepolia) - tokens are locked here
     * @param token Token to lock
     * @param amount Amount to lock
     * @param destinationChain Where to mint/release tokens
     * @return lockId Unique identifier for this lock
     */
    function lockTokens(
        address token,
        uint256 amount,
        Chain destinationChain
    ) external nonReentrant returns (bytes32 lockId) {
        require(whitelistedTokens[token], "Token not whitelisted");
        require(amount > 0, "Amount must be > 0");
        
        // Transfer tokens from user to bridge (lock them)
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Generate unique lock ID
        lockId = keccak256(
            abi.encodePacked(msg.sender, token, amount, destinationChain, block.timestamp, block.chainid)
        );
        
        // Store as deposit that will be processed on destination chain
        deposits[lockId] = CrossChainDeposit({
            user: msg.sender,
            token: token,
            amount: amount,
            sourceChain: getCurrentChain(),
            timestamp: block.timestamp,
            processed: false
        });
        
        emit TokensLocked(lockId, msg.sender, token, amount, destinationChain);
        
        return lockId;
    }

    /**
     * @notice Get current chain enum based on chain ID
     */
    function getCurrentChain() public view returns (Chain) {
        uint256 chainId = block.chainid;
        if (chainId == 1287) return Chain.Moonbeam;
        if (chainId == 11155111) return Chain.Sepolia;
        if (chainId == 1000) return Chain.PolkadotHub;
        if (chainId == 2000) return Chain.Acala;
        if (chainId == 2006) return Chain.Astar;
        if (chainId == 42161 || chainId == 421614) return Chain.Arbitrum;
        return Chain.Moonbeam; // default
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
     * @notice Complete cross-chain deposit (called on destination chain by relayer)
     * @dev Called on Moonbase when tokens are locked on Sepolia
     * @param depositId The unique deposit identifier (lockId from source chain)
     * @param depositToVault If true, deposit directly to SmartVault as collateral
     */
    function completeCrossChainDeposit(bytes32 depositId, bool depositToVault) external nonReentrant {
        CrossChainDeposit storage deposit = deposits[depositId];
        require(!deposit.processed, "Already processed");
        require(deposit.amount > 0, "Invalid deposit");
        
        deposit.processed = true;
        
        // Update TVL tracking
        tvlByChain[deposit.sourceChain] += deposit.amount;
        
        // Get the destination token address (mapped token on this chain)
        address destToken = getDestinationToken(deposit.sourceChain, deposit.token);
        require(destToken != address(0), "Token mapping not set");
        require(whitelistedTokens[destToken], "Destination token not whitelisted");
        
        if (depositToVault && smartVault != address(0)) {
            // Deposit directly to SmartVault as collateral using destination token
            // Transfer tokens from bridge to vault
            IERC20(destToken).transfer(smartVault, deposit.amount);
            
            // Call SmartVault's cross-chain deposit function
            (bool success,) = smartVault.call(
                abi.encodeWithSignature(
                    "depositFromCrossChain(address,address,uint256,uint8)",
                    deposit.user,
                    destToken,
                    deposit.amount,
                    uint8(deposit.sourceChain)
                )
            );
            require(success, "Vault deposit failed");
        } else {
            // Transfer destination tokens to user's wallet
            IERC20(destToken).transfer(deposit.user, deposit.amount);
        }
        
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
