import { createPublicClient, createWalletClient, http, defineChain, parseAbiItem } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

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
  const filePath = path.join(__dirname, "..", "deployments", `${network}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Deployment file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Bridge Relayer - Listens for bridge events and completes transfers
class BridgeRelayer {
  private moonbaseClient: any;
  private sepoliaClient: any;
  private moonbaseWallet: any;
  private sepoliaWallet: any;
  private moonbaseDeployment: any;
  private sepoliaDeployment: any;
  private account: any;
  
  private readonly BRIDGE_ABI = [
    {
      "type": "event",
      "name": "CrossChainDepositInitiated",
      "inputs": [
        {"name": "depositId", "type": "bytes32", "indexed": true},
        {"name": "user", "type": "address", "indexed": true},
        {"name": "token", "type": "address", "indexed": false},
        {"name": "amount", "type": "uint256", "indexed": false},
        {"name": "sourceChain", "type": "uint8", "indexed": false}
      ]
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

  constructor() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY not set in .env");
    }

    this.account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);

    // Setup Moonbase Alpha clients with timeout configuration
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

    // Setup Sepolia clients with timeout configuration
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
      this.moonbaseDeployment = loadDeployment("polkadot-hub");
      console.log("✓ Loaded Moonbase deployment");
    } catch (e) {
      console.log("ℹ Moonbase deployment not found, will use manual config");
      this.moonbaseDeployment = {
        contracts: {
          xcmBridge: "0x8d090e8e2f2fcacca6c952e75f1f2ed224c59cef"
        }
      };
    }

    try {
      this.sepoliaDeployment = loadDeployment("sepolia-bridge");
      console.log("✓ Loaded Sepolia deployment");
    } catch (e) {
      console.log("⚠ Sepolia deployment not found - please deploy bridge first");
      this.sepoliaDeployment = null;
    }
  }

  async start() {
    console.log("\n🌉 Bridge Relayer Starting...\n");
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

    console.log("\n🎯 Monitoring bridge events...\n");
    console.log("Moonbase Bridge:", this.moonbaseDeployment.contracts.xcmBridge);
    if (this.sepoliaDeployment) {
      console.log("Sepolia Bridge:", this.sepoliaDeployment.contracts.xcmBridge);
    }
    console.log();

    // Watch Moonbase bridge for deposits from other chains
    this.watchBridge(
      this.moonbaseClient,
      this.moonbaseWallet,
      this.moonbaseDeployment.contracts.xcmBridge,
      "Moonbase"
    );

    // Watch Sepolia bridge (if deployed)
    if (this.sepoliaDeployment) {
      this.watchBridge(
        this.sepoliaClient,
        this.sepoliaWallet,
        this.sepoliaDeployment.contracts.xcmBridge,
        "Sepolia"
      );
    }

    console.log("✅ Relayer is running. Press Ctrl+C to stop.\n");

    // Keep process alive
    return new Promise(() => {});
  }

  private watchBridge(client: any, wallet: any, bridgeAddress: string, chainName: string) {
    const eventAbi = parseAbiItem(
      'event CrossChainDepositInitiated(bytes32 indexed depositId, address indexed user, address token, uint256 amount, uint8 sourceChain)'
    );

    // Watch for new deposits
    client.watchEvent({
      address: bridgeAddress as `0x${string}`,
      event: eventAbi,
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
          await this.handleDeposit(log, wallet, bridgeAddress, chainName);
        }
      },
      pollingInterval: 5_000, // Check every 5 seconds
    });

    console.log(`👀 Watching ${chainName} bridge for deposits...`);
  }

  private async handleDeposit(log: any, wallet: any, bridgeAddress: string, chainName: string) {
    const { depositId, user, token, amount, sourceChain } = log.args;
    
    const chainNames = ['Polkadot Hub', 'Moonbeam', 'Acala', 'Astar', 'Arbitrum'];
    const sourceChainName = chainNames[Number(sourceChain)] || `Chain ${sourceChain}`;

    console.log(`\n🔔 New deposit detected on ${chainName}!`);
    console.log(`   Deposit ID: ${depositId}`);
    console.log(`   User: ${user}`);
    console.log(`   Token: ${token}`);
    console.log(`   Amount: ${(Number(amount) / 1e18).toFixed(4)}`);
    console.log(`   Source: ${sourceChainName}`);

    try {
      // Wait a bit to simulate XCM message propagation time
      console.log(`   ⏳ Simulating XCM message propagation (5 seconds)...`);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Complete the deposit
      console.log(`   📝 Completing cross-chain deposit...`);
      
      const hash = await wallet.writeContract({
        address: bridgeAddress as `0x${string}`,
        abi: this.BRIDGE_ABI,
        functionName: 'completeCrossChainDeposit',
        args: [depositId, true], // depositToVault = true
      });

      console.log(`   ⏳ Transaction: ${hash}`);
      
      const client = chainName === "Moonbase" ? this.moonbaseClient : this.sepoliaClient;
      const receipt = await client.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log(`   ✅ Deposit completed successfully!`);
        console.log(`   🎉 User ${user} can now borrow against this collateral\n`);
      } else {
        console.log(`   ❌ Transaction failed\n`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error completing deposit: ${error.message}\n`);
    }
  }
}

// Start the relayer
async function main() {
  const relayer = new BridgeRelayer();
  await relayer.start();
}

main().catch(console.error);
