import hre from "hardhat";
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
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
 * Deploy script for Polkadot Hub
 * Deploys all SECP protocol contracts to Polkadot Hub testnet
 */
async function main() {
  console.log("🚀 Deploying SECP Protocol to Polkadot Hub...\n");

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

  console.log("Deploying with account:", account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Account balance:", balance.toString());
  console.log();

  if (balance === 0n) {
    throw new Error("❌ No balance. Please fund your account with testnet tokens");
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

  // 1. Deploy Mock Tokens
  console.log("═══════════════════════════════════════");
  console.log("1️⃣  DEPLOYING MOCK TOKENS");
  console.log("═══════════════════════════════════════\n");
  
  const mockUSDC = await deploy("MockUSDC");
  const mockYield = await deploy("MockYield");
  const mockRWA = await deploy("MockRWA");
  const mockDOT = await deploy("MockDOT");
  const mockWBTC = await deploy("MockWBTC");

  // 2. Deploy Oracle
  console.log("═══════════════════════════════════════");
  console.log("2️⃣  DEPLOYING ORACLE");
  console.log("═══════════════════════════════════════\n");
  
  const mockOracle = await deploy("MockOracle");

  // 3. Deploy SmartVault
  console.log("═══════════════════════════════════════");
  console.log("3️⃣  DEPLOYING SMART VAULT");
  console.log("═══════════════════════════════════════\n");
  
  const smartVault = await deploy("SmartVault");

  // 4. Deploy LoanManager
  console.log("═══════════════════════════════════════");
  console.log("4️⃣  DEPLOYING LOAN MANAGER");
  console.log("═══════════════════════════════════════\n");
  
  const loanManager = await deploy("LoanManager", [mockUSDC]);

  // 5. Deploy CollateralManager
  console.log("═══════════════════════════════════════");
  console.log("5️⃣  DEPLOYING COLLATERAL MANAGER");
  console.log("═══════════════════════════════════════\n");
  
  const collateralManager = await deploy("CollateralManager", [
    smartVault,
    mockOracle,
    loanManager
  ]);

  // 6. Deploy AntiLiquidation
  console.log("═══════════════════════════════════════");
  console.log("6️⃣  DEPLOYING ANTI-LIQUIDATION");
  console.log("═══════════════════════════════════════\n");
  
  const antiLiquidation = await deploy("AntiLiquidation", [
    smartVault,
    loanManager
  ]);

  // 7. Deploy XCM Bridge
  console.log("═══════════════════════════════════════");
  console.log("7️⃣  DEPLOYING XCM BRIDGE");
  console.log("═══════════════════════════════════════\n");
  
  const xcmBridge = await deploy("XCMBridge");

  // 8. Deploy AI Risk Predictor
  console.log("═══════════════════════════════════════");
  console.log("8️⃣  DEPLOYING AI RISK PREDICTOR");
  console.log("═══════════════════════════════════════\n");
  
  const aiRiskPredictor = await deploy("AIRiskPredictor");

  // 9. Deploy Cross-Chain Rebalancer
  console.log("═══════════════════════════════════════");
  console.log("9️⃣  DEPLOYING CROSS-CHAIN REBALANCER");
  console.log("═══════════════════════════════════════\n");
  
  const crossChainRebalancer = await deploy("CrossChainRebalancer", [
    smartVault,
    collateralManager,
    antiLiquidation
  ]);

  // 10. Deploy YieldManager
  console.log("═══════════════════════════════════════");
  console.log("🔟  DEPLOYING YIELD MANAGER");
  console.log("═══════════════════════════════════════\n");
  
  const yieldManager = await deploy("YieldManager", [
    loanManager,
    collateralManager
  ]);

  // Save deployment addresses
  const chainId = await publicClient.getChainId();
  const deploymentInfo = {
    network: hre.network.name,
    chainId: chainId.toString(),
    deployer: account.address,
    timestamp: new Date().toISOString(),
    contracts: deployedContracts,
  };

  console.log("\n═══════════════════════════════════════");
  console.log("📝 DEPLOYMENT SUMMARY");
  console.log("═══════════════════════════════════════\n");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  const filename = `${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: deployments/${filename}`);

  console.log("\n✨ Deployment complete!");
  console.log("\n🔧 Next step: Run the setup script:");
  console.log(`   npm run setup:polkadot`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
