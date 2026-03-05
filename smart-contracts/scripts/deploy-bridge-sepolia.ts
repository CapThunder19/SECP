import hre from "hardhat";
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

// Define Sepolia testnet with multiple reliable RPC endpoints
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
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' }
  }
});

/**
 * Deploy bridge contracts on Sepolia for cross-chain testing
 */
async function main() {
  console.log("🚀 Deploying SECP Bridge on Sepolia...\n");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === "your_private_key_here") {
    throw new Error("Please set PRIVATE_KEY in .env file");
  }

  const account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);
  
  // Create clients with better timeout and retry configuration
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(undefined, {
      timeout: 30_000, // 30 seconds
      retryCount: 3,
      retryDelay: 1000,
    }),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(undefined, {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  });

  console.log("Deploying with account:", account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Account balance:", (Number(balance) / 1e18).toFixed(4), "ETH");
  console.log();

  if (balance === 0n) {
    console.error("❌ No balance. Get Sepolia ETH from:");
    console.error("   https://sepoliafaucet.com/");
    console.error("   https://www.alchemy.com/faucets/ethereum-sepolia");
    throw new Error("Insufficient balance");
  }

  const deployedContracts: Record<string, `0x${string}`> = {};

  // Helper to deploy a contract
  const deploy = async (name: string, args: any[] = []) => {
    console.log(`📦 Deploying ${name}...`);
    const artifact = await hre.artifacts.readArtifact(name);
    
    const hash = await walletClient.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode as `0x${string}`,
      args: args,
    });
    
    console.log(`   ⏳ Transaction: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (!receipt.contractAddress) {
      throw new Error(`Failed to deploy ${name}`);
    }
    
    deployedContracts[name] = receipt.contractAddress;
    console.log(`   ✅ ${name} deployed at: ${receipt.contractAddress}\n`);
    
    return receipt.contractAddress;
  };

  // Deploy test tokens
  console.log("=== Deploying Test Tokens ===\n");
  const mockUSDC = await deploy("MockUSDC");
  const mockDOT = await deploy("MockDOT");
  const mockWBTC = await deploy("MockWBTC");

  // Deploy XCMBridge
  console.log("=== Deploying Bridge ===\n");
  const xcmBridge = await deploy("XCMBridge");

  // Whitelist tokens on bridge
  console.log("=== Configuring Bridge ===\n");
  const bridgeArtifact = await hre.artifacts.readArtifact("XCMBridge");
  
  for (const [name, address] of Object.entries({ mockUSDC, mockDOT, mockWBTC })) {
    console.log(`Whitelisting ${name}...`);
    const hash = await walletClient.writeContract({
      address: xcmBridge,
      abi: bridgeArtifact.abi,
      functionName: 'whitelistToken',
      args: [address, true],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   ✅ ${name} whitelisted\n`);
  }

  // Save deployment info
  const deployment = {
    network: "sepolia",
    chainId: 11155111,
    deployer: account.address,
    timestamp: new Date().toISOString(),
    contracts: {
      mockUSDC,
      mockDOT,
      mockWBTC,
      xcmBridge,
    },
  };

  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "sepolia-bridge.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n=== Deployment Complete ===\n");
  console.log("Bridge Contract:", xcmBridge);
  console.log("Test Tokens:");
  console.log("  USDC:", mockUSDC);
  console.log("  DOT:", mockDOT);
  console.log("  WBTC:", mockWBTC);
  console.log("\n📝 Saved to deployments/sepolia-bridge.json");
  console.log("\n🎉 Sepolia bridge ready for cross-chain transactions!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
