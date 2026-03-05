import { createPublicClient, createWalletClient, http, defineChain, parseAbiItem, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Define chains
const moonbaseAlpha = defineChain({
  id: 1287,
  name: 'Moonbase Alpha',
  nativeCurrency: { name: 'DEV', symbol: 'DEV', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.api.moonbase.moonbeam.network'] }
  },
});

const sepolia = defineChain({
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { 
      http: [
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://rpc2.sepolia.org',
        'https://sepolia.gateway.tenderly.co'
      ] 
    }
  },
});

// Load deployment information
function loadDeployment(network: string) {
  // Get the directory of the current file
  const scriptDir = process.cwd().includes('smart-contracts') 
    ? path.join(process.cwd(), 'deployments')
    : path.join(process.cwd(), 'smart-contracts', 'deployments');
  
  const filePath = path.join(scriptDir, `${network}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Deployment file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Real Cross-Chain Bridge Relayer
class CrossChainBridgeRelayer {
  private moonbaseClient: any;
  private sepoliaClient: any;
  private moonbaseWallet: any;
  private sepoliaWallet: any;
  private moonbaseDeployment: any;
  private sepoliaDeployment: any;
  private account: any;
  private processedLocks: Set<string> = new Set();
  
  private readonly BRIDGE_ABI = [
    {
      "type": "event",
      "name": "TokensLocked",
      "inputs": [
        {"name": "lockId", "type": "bytes32", "indexed": true},
        {"name": "user", "type": "address", "indexed": true},
        {"name": "token", "type": "address", "indexed": true},
        {"name": "amount", "type": "uint256", "indexed": false},
        {"name": "destinationChain", "type": "uint8", "indexed": false}
      ]
    },
    {
      "type": "function",
      "name": "initiateCrossChainDeposit",
      "inputs": [
        {"name": "user", "type": "address"},
        {"name": "token", "type": "address"},
        {"name": "amount", "type": "uint256"},
        {"name": "sourceChain", "type": "uint8"}
      ],
      "outputs": [{"name": "depositId", "type": "bytes32"}],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "completeCrossChainDeposit",
      "inputs": [
        {"name": "depositId", "type": "bytes32"},
        {"name": "depositToVault", "type": "bool"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "deposits",
      "inputs": [{"name": "", "type": "bytes32"}],
      "outputs": [
        {"name": "user", "type": "address"},
        {"name": "token", "type": "address"},
        {"name": "amount", "type": "uint256"},
        {"name": "sourceChain", "type": "uint8"},
        {"name": "timestamp", "type": "uint256"},
        {"name": "processed", "type": "bool"}
      ],
      "stateMutability": "view"
    }
  ];

  // Chain enum mapping
  private readonly CHAIN_ENUM = {
    PolkadotHub: 0,
    Moonbeam: 1,
    Acala: 2,
    Astar: 3,
    Arbitrum: 4,
    Sepolia: 5
  };

  constructor() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY not set in .env");
    }

    this.account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);

    // Setup Moonbase Alpha clients
    this.moonbaseClient = createPublicClient({
      chain: moonbaseAlpha,
      transport: http(undefined, {
        timeout: 30_000,
        retryCount: 3,
        retryDelay: 1000,
      }),
    });

    this.moonbaseWallet = createWalletClient({
      account: this.account,
      chain: moonbaseAlpha,
      transport: http(undefined, {
        timeout: 30_000,
        retryCount: 3,
        retryDelay: 1000,
      }),
    });

    // Setup Sepolia clients
    this.sepoliaClient = createPublicClient({
      chain: sepolia,
      transport: http(undefined, {
        timeout: 30_000,
        retryCount: 3,
        retryDelay: 1000,
      }),
    });

    this.sepoliaWallet = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(undefined, {
        timeout: 30_000,
        retryCount: 3,
        retryDelay: 1000,
      }),
    });

    // Load deployments
    try {
      this.moonbaseDeployment = loadDeployment("moonbase-upgraded");
      console.log("✓ Loaded Moonbase deployment");
    } catch (e) {
      console.log("ℹ Moonbase deployment not found");
      this.moonbaseDeployment = {
        contracts: {
          XCMBridge: "0xe9a634a478eaddc288721736426abd5db0395825"
        }
      };
    }

    try {
      this.sepoliaDeployment = loadDeployment("sepolia-bridge");
      console.log("✓ Loaded Sepolia deployment");
    } catch (e) {
      console.log("⚠ Sepolia deployment not found");
      this.sepoliaDeployment = null;
    }
  }

  async start() {
    console.log("\n🌉 Real Cross-Chain Bridge Relayer Starting...\n");
    console.log("Relayer Address:", this.account.address);
    console.log();

    // Check balances
    const moonbaseBalance = await this.moonbaseClient.getBalance({ 
      address: this.account.address 
    });
    console.log("Moonbase Balance:", (Number(moonbaseBalance) / 1e18).toFixed(4), "DEV");

    if (this.sepoliaDeployment) {
      const sepoliaBalance = await this.sepoliaClient.getBalance({ 
        address: this.account.address 
      });
      console.log("Sepolia Balance:", (Number(sepoliaBalance) / 1e18).toFixed(4), "ETH");
    }

    console.log();
    console.log("Bridge Contracts:");
    console.log("  Moonbase:", this.moonbaseDeployment.contracts.XCMBridge);
    if (this.sepoliaDeployment) {
      console.log("  Sepolia:", this.sepoliaDeployment.contracts.xcmBridge);
    }
    console.log();
    console.log("👀 Watching for cross-chain token locks...\n");

    // Watch for locks on both chains
    if (this.sepoliaDeployment) {
      this.watchSepoliaLocks();
    }
    this.watchMoonbaseLocks();
  }

  /**
   * Watch Sepolia for token locks → complete on Moonbase
   */
  private watchSepoliaLocks() {
    const bridgeAddress = this.sepoliaDeployment.contracts.xcmBridge as `0x${string}`;
    
    console.log("🔍 Watching Sepolia for locks → will complete on Moonbase\n");
    
    this.sepoliaClient.watchEvent({
      address: bridgeAddress,
      event: parseAbiItem('event TokensLocked(bytes32 indexed lockId, address indexed user, address indexed token, uint256 amount, uint8 destinationChain)'),
      pollingInterval: 5_000,
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
          await this.handleSepoliaLock(log);
        }
      }
    });
  }

  /**
   * Watch Moonbase for token locks → complete on Sepolia
   */
  private watchMoonbaseLocks() {
    const bridgeAddress = this.moonbaseDeployment.contracts.XCMBridge as `0x${string}`;
    
    console.log("🔍 Watching Moonbase for locks → will complete on Sepolia\n");
    
    this.moonbaseClient.watchEvent({
      address: bridgeAddress,
      event: parseAbiItem('event TokensLocked(bytes32 indexed lockId, address indexed user, address indexed token, uint256 amount, uint8 destinationChain)'),
      pollingInterval: 5_000,
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
          await this.handleMoonbaseLock(log);
        }
      }
    });
  }

  /**
   * Handle lock on Sepolia → mint on Moonbase
   */
  private async handleSepoliaLock(log: any) {
    const lockId = log.topics[1];  
    const user = `0x${log.topics[2].slice(26)}` as `0x${string}`;
    const token = `0x${log.topics[3].slice(26)}` as `0x${string}`;
    const amount = BigInt(log.data.slice(0, 66));
    const destinationChain = parseInt(log.data.slice(66), 16);

    // Check if this is for Moonbase
    if (destinationChain !== this.CHAIN_ENUM.Moonbeam) {
      return; // Not for Moonbase
    }

    // Check if already processed
    if (this.processedLocks.has(lockId)) {
      return;
    }

    console.log("🔔 Tokens locked on Sepolia!");
    console.log("   Lock ID:", lockId);
    console.log("   User:", user);
    console.log("   Token:", token);
    console.log("   Amount:", formatEther(amount));
    console.log("   Destination: Moonbase Alpha");
    console.log();

    try {
      // Simulate XCM message propagation delay
      console.log("   ⏳ Simulating cross-chain message (5 seconds)...");
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 1: Initiate deposit on Moonbase (create record)
      console.log("   📝 Creating deposit record on Moonbase...");
      const moonbaseBridge = this.moonbaseDeployment.contracts.XCMBridge as `0x${string}`;
      
      const initiateHash = await this.moonbaseWallet.writeContract({
        address: moonbaseBridge,
        abi: this.BRIDGE_ABI,
        functionName: 'initiateCrossChainDeposit',
        args: [user, token, amount, this.CHAIN_ENUM.Sepolia]
      });
      
      await this.moonbaseClient.waitForTransactionReceipt({ hash: initiateHash });
      console.log("   ✅ Deposit record created");

      // Step 2: Complete the deposit (release tokens)
      console.log("   💰 Completing deposit on Moonbase...");
      const completeHash = await this.moonbaseWallet.writeContract({
        address: moonbaseBridge,
        abi: this.BRIDGE_ABI,
        functionName: 'completeCrossChainDeposit',
        args: [lockId, true] // true = deposit to vault
      });

      const receipt = await this.moonbaseClient.waitForTransactionReceipt({ hash: completeHash });
      
      if (receipt.status === 'success') {
        console.log("   ✅ Cross-chain transfer complete!");
        console.log("   🎉 User", user, "received tokens on Moonbase");
        console.log();
        this.processedLocks.add(lockId);
      } else {
        console.log("   ❌ Transfer failed");
        console.log();
      }
    } catch (error: any) {
      console.error("   ❌ Error processing lock:", error.message);
      console.log();
    }
  }

  /**
   * Handle lock on Moonbase → mint on Sepolia
   */
  private async handleMoonbaseLock(log: any) {
    const lockId = log.topics[1];
    const user = `0x${log.topics[2].slice(26)}` as `0x${string}`;
    const token = `0x${log.topics[3].slice(26)}` as `0x${string}`;
    const amount = BigInt(log.data.slice(0, 66));
    const destinationChain = parseInt(log.data.slice(66), 16);

    // Check if this is for Sepolia
    if (destinationChain !== this.CHAIN_ENUM.Sepolia) {
      return;
    }

    // Check if Sepolia deployment exists
    if (!this.sepoliaDeployment) {
      console.log("⚠ Sepolia bridge not deployed, skipping");
      return;
    }

    // Check if already processed
    if (this.processedLocks.has(lockId)) {
      return;
    }

    console.log("🔔 Tokens locked on Moonbase!");
    console.log("   Lock ID:", lockId);
    console.log("   User:", user);
    console.log("   Token:", token);
    console.log("   Amount:", formatEther(amount));
    console.log("   Destination: Sepolia");
    console.log();

    try {
      // Simulate XCM message propagation delay
      console.log("   ⏳ Simulating cross-chain message (5 seconds)...");
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 1: Initiate deposit on Sepolia
      console.log("   📝 Creating deposit record on Sepolia...");
      const sepoliaBridge = this.sepoliaDeployment.contracts.xcmBridge as `0x${string}`;
      
      const initiateHash = await this.sepoliaWallet.writeContract({
        address: sepoliaBridge,
        abi: this.BRIDGE_ABI,
        functionName: 'initiateCrossChainDeposit',
        args: [user, token, amount, this.CHAIN_ENUM.Moonbeam]
      });
      
      await this.sepoliaClient.waitForTransactionReceipt({ hash: initiateHash });
      console.log("   ✅ Deposit record created");

      // Step 2: Complete the deposit
      console.log("   💰 Completing deposit on Sepolia...");
      const completeHash = await this.sepoliaWallet.writeContract({
        address: sepoliaBridge,
        abi: this.BRIDGE_ABI,
        functionName: 'completeCrossChainDeposit',
        args: [lockId, false] // false = send to user wallet (no vault on Sepolia)
      });

      const receipt = await this.sepoliaClient.waitForTransactionReceipt({ hash: completeHash });
      
      if (receipt.status === 'success') {
        console.log("   ✅ Cross-chain transfer complete!");
        console.log("   🎉 User", user, "received tokens on Sepolia");
        console.log();
        this.processedLocks.add(lockId);
      } else {
        console.log("   ❌ Transfer failed");
        console.log();
      }
    } catch (error: any) {
      console.error("   ❌ Error processing lock:", error.message);
      console.log();
    }
  }
}

// Start the relayer
const relayer = new CrossChainBridgeRelayer();
relayer.start().catch(console.error);
