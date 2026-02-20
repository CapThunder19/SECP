import hre from "hardhat";
import { parseEther } from "viem";
import { createWalletClient, createPublicClient, http, getContract } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Post-deployment setup script for SECP Protocol on Arbitrum Sepolia
 * 
 * This script:
 * 1. Sets up oracle prices
 * 2. Configures asset weights
 * 3. Adds supported tokens to vault
 * 4. Sets up authorization between contracts
 * 5. Configures yield tokens
 */

async function main() {
  console.log("🚀 Starting SECP Protocol setup on Arbitrum Sepolia...\n");

  // Get private key from environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === "your_private_key_here") {
    throw new Error("Please set PRIVATE_KEY in .env file");
  }
  
  // Setup viem clients manually (Hardhat 3 scripts require manual setup)
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
  
  console.log("📍 Using address:", account.address, "\n");

  // Get deployed contract addresses from deployment file
  const addresses = {
    mockUSDC: "0x4cb63f6ba14e54f3422e3b66955ef5ee690ae2c8",
    mockYield: "0x89fa6ae8ae17cdff1b917a31fba44f7bddcd3c62",
    mockRWA: "0x3fac055201501b26a8083761655bd1909840c454",
    mockOracle: "0x539e55d266f1ff01716432755ec31f6674e928c1",
    smartVault: "0x2e8026bc45fe0fae2b159a3c82cada12670769e2",
    loanManager: "0xba5be20d3d96e89ffbf20f9812df73cada28e376",
    collateralManager: "0xfa7e1a8e4be412b9c7efcbb5f14ddcc5820da599",
    antiLiquidation: "0x55c65fa19b212026125b59d8db6100079ed86ac6",
    rebalancer: "0x0161bc2788638e2b2d27fc037dfca0fab7dee46f",
    yieldManager: "0x435f820c2359e487cd963c3556d88d0196a7ae26",
  };

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
  const mockOracle = await getContractInstance("MockOracle", addresses.mockOracle);
  const smartVault = await getContractInstance("SmartVault", addresses.smartVault);
  const collateralManager = await getContractInstance("CollateralManager", addresses.collateralManager);
  const loanManager = await getContractInstance("LoanManager", addresses.loanManager);
  const antiLiquidation = await getContractInstance("AntiLiquidation", addresses.antiLiquidation);
  const rebalancer = await getContractInstance("Rebalancer", addresses.rebalancer);
  const yieldManager = await getContractInstance("YieldManager", addresses.yieldManager);

  // 1️⃣ Setup Oracle Prices (example prices in 18 decimals)
  console.log("1️⃣ Setting up oracle prices...");
  let hash = await mockOracle.write.setPrice([addresses.mockUSDC as `0x${string}`, parseEther("1")]); // $1
  await publicClient.waitForTransactionReceipt({ hash });
  hash = await mockOracle.write.setPrice([addresses.mockYield as `0x${string}`, parseEther("1.05")]); // $1.05
  await publicClient.waitForTransactionReceipt({ hash });
  hash = await mockOracle.write.setPrice([addresses.mockRWA as `0x${string}`, parseEther("1.5")]); // $1.50
  await publicClient.waitForTransactionReceipt({ hash });
  hash = await mockOracle.write.setVolatility([20n]); // Low volatility initially
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Oracle prices set\n");

  // 2️⃣ Configure Asset Weights (100 = safest, lower = riskier)
  console.log("2️⃣ Setting up asset weights...");
  hash = await collateralManager.write.setAssetWeight([addresses.mockUSDC as `0x${string}`, 90n]); // Stable - 90%
  await publicClient.waitForTransactionReceipt({ hash });
  hash = await collateralManager.write.setAssetWeight([addresses.mockYield as `0x${string}`, 80n]); // Yield - 80%
  await publicClient.waitForTransactionReceipt({ hash });
  hash = await collateralManager.write.setAssetWeight([addresses.mockRWA as `0x${string}`, 100n]); // RWA - 100% (safest)
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Asset weights configured\n");

  // 3️⃣ Add Supported Tokens to Vault
  console.log("3️⃣ Adding supported tokens to vault...");
  hash = await smartVault.write.addSupportedToken([addresses.mockUSDC as `0x${string}`]);
  await publicClient.waitForTransactionReceipt({ hash });
  hash = await smartVault.write.addSupportedToken([addresses.mockYield as `0x${string}`]);
  await publicClient.waitForTransactionReceipt({ hash });
  hash = await smartVault.write.addSupportedToken([addresses.mockRWA as `0x${string}`]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Tokens added to vault\n");

  // 4️⃣ Setup Contract Authorizations
  console.log("4️⃣ Setting up contract authorizations...");
  
  // LoanManager needs to know about CollateralManager and AntiLiquidation
  hash = await loanManager.write.setCollateralManager([addresses.collateralManager as `0x${string}`]);
  await publicClient.waitForTransactionReceipt({ hash });
  hash = await loanManager.write.setAntiLiquidation([addresses.antiLiquidation as `0x${string}`]);
  await publicClient.waitForTransactionReceipt({ hash });
  
  // AntiLiquidation needs authorization to call vault and loan manager
  hash = await antiLiquidation.write.addAuthorized([addresses.rebalancer as `0x${string}`]);
  await publicClient.waitForTransactionReceipt({ hash });
  
  console.log("✅ Authorizations configured\n");

  // 5️⃣ Configure Asset Types in Rebalancer
  console.log("5️⃣ Setting up asset types in rebalancer...");
  hash = await rebalancer.write.setAssetType([addresses.mockUSDC as `0x${string}`, 0]); // Stable
  await publicClient.waitForTransactionReceipt({ hash });
  hash = await rebalancer.write.setAssetType([addresses.mockRWA as `0x${string}`, 1]); // RWA
  await publicClient.waitForTransactionReceipt({ hash });
  hash = await rebalancer.write.setAssetType([addresses.mockYield as `0x${string}`, 2]); // Yield
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Asset types configured\n");

  // 6️⃣ Setup Yield Tokens
  console.log("6️⃣ Configuring yield tokens...");
  hash = await yieldManager.write.addYieldToken([addresses.mockYield as `0x${string}`, 500n]); // 5% APY (500 basis points)
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Yield tokens configured\n");

  console.log("🎉 SECP Protocol setup complete!");
  console.log("\n📋 Contract Addresses:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`${name.padEnd(20)}: ${address}`);
  });
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
