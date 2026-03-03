import hre from "hardhat";
import { createWalletClient, createPublicClient, http, defineChain, getContract } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Define Moonbase Alpha chain (Moonbeam testnet)
const moonbaseAlpha = defineChain({
  id: 1287,
  name: 'Moonbase Alpha',
  nativeCurrency: { name: 'DEV', symbol: 'DEV', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.POLKADOT_HUB_TESTNET_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network'] }
  },
  blockExplorers: {
    default: { name: 'Moonscan', url: 'https://moonbase.moonscan.io' }
  }
});

// Define Polkadot Hub chain
const polkadotHub = defineChain({
  id: 1000,
  name: 'Polkadot Asset Hub',
  nativeCurrency: { name: 'DOT', symbol: 'DOT', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.POLKADOT_HUB_RPC_URL || 'https://rpc.polkadot.io'] }
  }
});

/**
 * Setup script for Polkadot Hub deployment
 * Configures risk weights, whitelists tokens, and connects contracts
 */
async function main() {
  console.log("🚀 Setting up SECP Protocol on Polkadot Hub...\n");

  // Find the most recent deployment file for this network
  const deploymentsDir = path.join(__dirname, "../deployments");
  const files = fs.readdirSync(deploymentsDir);
  const networkFiles = files.filter(f => f.startsWith(hre.network.name) && f.endsWith('.json'));
  
  if (networkFiles.length === 0) {
    console.error(`❌ No deployment file found for network: ${hre.network.name}`);
    console.log("\nPlease run deployment first:");
    console.log(`   npm run deploy:polkadot`);
    process.exit(1);
  }

  // Sort by timestamp (filename) and get the most recent
  const latestFile = networkFiles.sort().reverse()[0];
  console.log(`📄 Using deployment file: ${latestFile}\n`);

  const deploymentData = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, latestFile), 'utf8')
  );
  const addresses = deploymentData.contracts;

  console.log("Contract addresses:");
  console.log(addresses);
  console.log();

  // Setup viem clients
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === "your_private_key_here") {
    throw new Error("Please set PRIVATE_KEY in .env file");
  }

  const account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);
  
  // Select chain based on network
  const chain = hre.network.name === 'polkadotHub' ? polkadotHub : moonbaseAlpha;
  const rpcUrl = chain.rpcUrls.default.http[0];
  
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  // Helper to get contract instance
  const getContractInstance = async (name: string, address: string) => {
    const artifact = await hre.artifacts.readArtifact(name);
    return getContract({
      address: address as `0x${string}`,
      abi: artifact.abi,
      client: { public: publicClient, wallet: walletClient },
    });
  };

  // Get contract instances
  console.log("📦 Loading contract instances...\n");
  const collateralManager = await getContractInstance("CollateralManager", addresses.CollateralManager);
  const xcmBridge = await getContractInstance("XCMBridge", addresses.XCMBridge);
  const aiRiskPredictor = await getContractInstance("AIRiskPredictor", addresses.AIRiskPredictor);
  const crossChainRebalancer = await getContractInstance("CrossChainRebalancer", addresses.CrossChainRebalancer);
  const mockOracle = await getContractInstance("MockOracle", addresses.MockOracle);

  console.log("📊 Setting up asset risk weights...");
  
  // Set risk weights for different collateral types
  let hash = await collateralManager.write.setAssetWeight([addresses.MockDOT as `0x${string}`, 85n]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ DOT weight: 85");
  
  hash = await collateralManager.write.setAssetWeight([addresses.MockWBTC as `0x${string}`, 90n]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ WBTC weight: 90");
  
  hash = await collateralManager.write.setAssetWeight([addresses.MockRWA as `0x${string}`, 80n]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ RWA weight: 80");
  
  hash = await collateralManager.write.setAssetWeight([addresses.MockUSDC as `0x${string}`, 95n]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ USDC weight: 95");
  
  hash = await collateralManager.write.setAssetWeight([addresses.MockYield as `0x${string}`, 75n]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Yield weight: 75\n");

  console.log("🔮 Setting up oracle prices...");
  // Set prices for new tokens (DOT and WBTC)
  hash = await mockOracle.write.setPrice([addresses.MockDOT as `0x${string}`, 6000000000000000000n]); // $6.00
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ DOT price: $6.00");
  
  hash = await mockOracle.write.setPrice([addresses.MockWBTC as `0x${string}`, 65000000000000000000000n]); // $65,000 (note: 8 decimals for WBTC)
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ WBTC price: $65,000\n");

  console.log("🌉 Configuring XCM Bridge...");
  
  // Whitelist tokens for cross-chain transfers
  hash = await xcmBridge.write.whitelistToken([addresses.MockDOT as `0x${string}`, true]);
  await publicClient.waitForTransactionReceipt({ hash });
  
  hash = await xcmBridge.write.whitelistToken([addresses.MockWBTC as `0x${string}`, true]);
  await publicClient.waitForTransactionReceipt({ hash });
  
  hash = await xcmBridge.write.whitelistToken([addresses.MockUSDC as `0x${string}`, true]);
  await publicClient.waitForTransactionReceipt({ hash });
  
  hash = await xcmBridge.write.whitelistToken([addresses.MockRWA as `0x${string}`, true]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Tokens whitelisted for cross-chain transfers\n");

  console.log("🔗 Connecting contracts...");
  
  // Connect CollateralManager to AI Predictor and XCM Bridge
  hash = await collateralManager.write.setAIPredictor([addresses.AIRiskPredictor as `0x${string}`]);
  await publicClient.waitForTransactionReceipt({ hash });
  
  hash = await collateralManager.write.setXCMBridge([addresses.XCMBridge as `0x${string}`]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ CollateralManager connected to AI Predictor and XCM Bridge");
  
  // Connect CrossChainRebalancer to XCM Bridge and AI Predictor
  hash = await crossChainRebalancer.write.setXCMBridge([addresses.XCMBridge as `0x${string}`]);
  await publicClient.waitForTransactionReceipt({ hash });
  
  hash = await crossChainRebalancer.write.setAIPredictor([addresses.AIRiskPredictor as `0x${string}`]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ CrossChainRebalancer connected\n");

  console.log("🎨 Setting asset types for rebalancer...");
  
  // Set asset types for the cross-chain rebalancer
  // AssetType enum: Stable=0, RWA=1, Yield=2, Volatile=3, DOT=4, BTC=5
  hash = await crossChainRebalancer.write.setAssetType([addresses.MockDOT as `0x${string}`, 4]);
  await publicClient.waitForTransactionReceipt({ hash });
  
  hash = await crossChainRebalancer.write.setAssetType([addresses.MockWBTC as `0x${string}`, 5]);
  await publicClient.waitForTransactionReceipt({ hash });
  
  hash = await crossChainRebalancer.write.setAssetType([addresses.MockUSDC as `0x${string}`, 0]);
  await publicClient.waitForTransactionReceipt({ hash });
  
  hash = await crossChainRebalancer.write.setAssetType([addresses.MockRWA as `0x${string}`, 1]);
  await publicClient.waitForTransactionReceipt({ hash });
  
  hash = await crossChainRebalancer.write.setAssetType([addresses.MockYield as `0x${string}`, 2]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Asset types configured\n");

  console.log("🤖 Initializing AI Risk Predictor...");
  
  // Set initial market conditions (moderate risk)
  hash = await aiRiskPredictor.write.updateMarketConditions([50n, 70n, 40n]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Initial market conditions set (volatility: 50, liquidity: 70, correlation: 40)\n");

  console.log("═══════════════════════════════════════");
  console.log("✨ Setup complete! Protocol is ready.");
  console.log("═══════════════════════════════════════\n");
  console.log("📋 Deployed contracts:");
  console.log(`- MockDOT: ${addresses.MockDOT}`);
  console.log(`- MockWBTC: ${addresses.MockWBTC}`);
  console.log(`- XCMBridge: ${addresses.XCMBridge}`);
  console.log(`- AIRiskPredictor: ${addresses.AIRiskPredictor}`);
  console.log(`- CrossChainRebalancer: ${addresses.CrossChainRebalancer}`);
  console.log(`\n💡 Next: Update frontend config with these addresses!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
