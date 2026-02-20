import hre from "hardhat";
import { createWalletClient, createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
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

async function main() {
  console.log("🚀 Deploying SECP Protocol to Arbitrum Sepolia...\n");

  // Setup viem clients
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === "your_private_key_here") {
    throw new Error("Please set PRIVATE_KEY in .env file");
  }

  const account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);
  
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http("https://sepolia-rollup.arbitrum.io/rpc"),
  });
  
  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http("https://sepolia-rollup.arbitrum.io/rpc"),
  });

  console.log("📍 Deploying from:", account.address);
  
  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 Balance: ${Number(balance) / 1e18} ETH\n`);
  
  if (balance === 0n) {
    throw new Error("❌ No ETH balance. Please get testnet ETH from https://faucet.quicknode.com/arbitrum/sepolia");
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
    loanManager,
  ]);

  // 6. Deploy AntiLiquidation
  console.log("═══════════════════════════════════════");
  console.log("6️⃣  DEPLOYING ANTI-LIQUIDATION");
  console.log("═══════════════════════════════════════\n");
  
  const antiLiquidation = await deploy("AntiLiquidation", [
    smartVault,
    loanManager,
  ]);

  // 7. Deploy Rebalancer
  console.log("═══════════════════════════════════════");
  console.log("7️⃣  DEPLOYING REBALANCER");
  console.log("═══════════════════════════════════════\n");
  
  const rebalancer = await deploy("Rebalancer", [
    smartVault,
    collateralManager,
    antiLiquidation,
  ]);

  // 8. Deploy YieldManager
  console.log("═══════════════════════════════════════");
  console.log("8️⃣  DEPLOYING YIELD MANAGER");
  console.log("═══════════════════════════════════════\n");
  
  const yieldManager = await deploy("YieldManager", [
    loanManager,
    collateralManager,
  ]);

  // Save deployment addresses
  console.log("═══════════════════════════════════════");
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════\n");

  const deploymentData = {
    network: "arbitrumSepolia",
    chainId: 421614,
    deployer: account.address,
    timestamp: new Date().toISOString(),
    contracts: deployedContracts,
  };

  const deploymentDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentDir, "arbitrum-sepolia.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));

  console.log("📄 Deployment addresses saved to:", deploymentFile);
  console.log("\n📋 CONTRACT ADDRESSES:");
  console.log("═══════════════════════════════════════");
  Object.entries(deployedContracts).forEach(([name, address]) => {
    console.log(`${name.padEnd(20)}: ${address}`);
  });
  console.log("═══════════════════════════════════════\n");

  console.log("🎯 Next Steps:");
  console.log("1. Update addresses in scripts/setup.ts");
  console.log("2. Run: npm run setup:arbitrum");
  console.log("3. Update addresses in scripts/interact.ts");
  console.log("4. Run: npx hardhat run scripts/interact.ts --network arbitrumSepolia\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
