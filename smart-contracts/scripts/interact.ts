// Quick interaction script for SECP Protocol on Arbitrum Sepolia
// Usage: npx hardhat run scripts/interact.ts --network arbitrumSepolia

import hre from "hardhat";
import { parseEther, formatEther, getContract } from "viem";
import { createWalletClient, createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ⚠️ DEPLOYED CONTRACT ADDRESSES ON ARBITRUM SEPOLIA
const ADDRESSES = {
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

async function main() {
  // Setup viem clients manually (Hardhat 3 scripts require manual setup)
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

  console.log("🔗 Interacting with SECP Protocol on Arbitrum Sepolia");
  console.log("📍 Signer address:", account.address);
  console.log("\n");

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
  const mockUSDC = await getContractInstance("MockUSDC", ADDRESSES.mockUSDC);
  const smartVault = await getContractInstance("SmartVault", ADDRESSES.smartVault);
  const loanManager = await getContractInstance("LoanManager", ADDRESSES.loanManager);
  const collateralManager = await getContractInstance("CollateralManager", ADDRESSES.collateralManager);
  const rebalancer = await getContractInstance("Rebalancer", ADDRESSES.rebalancer);

  // 🪙 1. Get test tokens from faucet
  console.log("1️⃣ Getting test tokens from faucet...");
  const faucetTx = await mockUSDC.write.faucet();
  await publicClient.waitForTransactionReceipt({ hash: faucetTx });
  const balance = await mockUSDC.read.balanceOf([account.address]);
  console.log(`✅ Received ${formatEther(balance as bigint)} mUSDC\n`);

  // 💰 2. Deposit collateral
  console.log("2️⃣ Depositing collateral...");
  const depositAmount = parseEther("1000");
  
  const approveTx = await mockUSDC.write.approve([ADDRESSES.smartVault as `0x${string}`, depositAmount]);
  await publicClient.waitForTransactionReceipt({ hash: approveTx });
  
  const depositTx = await smartVault.write.deposit([ADDRESSES.mockUSDC as `0x${string}`, depositAmount]);
  await publicClient.waitForTransactionReceipt({ hash: depositTx });
  
  const collateral = await smartVault.read.getCollateral([account.address, ADDRESSES.mockUSDC as `0x${string}`]);
  console.log(`✅ Deposited ${formatEther(collateral as bigint)} mUSDC as collateral\n`);

  // 📊 3. Check collateral value
  console.log("3️⃣ Checking collateral value...");
  const collateralValue = await collateralManager.read.getTotalCollateralValue([account.address]);
  const maxBorrow = await collateralManager.read.getMaxBorrowAmount([account.address]);
  console.log(`💎 Collateral value: $${formatEther(collateralValue as bigint)}`);
  console.log(`🏦 Max borrowable: $${formatEther(maxBorrow as bigint)}\n`);

  // 💸 4. Borrow (if you want to test)
  console.log("4️⃣ Ready to borrow!");
  console.log("To borrow, uncomment the code below:\n");
  console.log(`
  // Borrow 500 USDC for 30 days
  const borrowAmount = parseEther("500");
  const duration = 30n; // days
  
  const borrowTx = await loanManager.write.borrow([borrowAmount, duration]);
  await publicClient.waitForTransactionReceipt({ hash: borrowTx });
  
  const debt = await loanManager.read.debt([account.address]);
  console.log(\`📝 Borrowed: \${formatEther(debt)} USDC\`);
  `);

  // 🎯 5. Check health factor
  console.log("\n5️⃣ Checking health factor...");
  const healthFactor = await collateralManager.read.getHealthFactor([account.address]);
  console.log(`❤️  Health Factor: ${(healthFactor as bigint).toString()}`);
  if ((healthFactor as bigint) > 150n) {
    console.log("   Status: ✅ SAFE");
  } else if ((healthFactor as bigint) > 100n) {
    console.log("   Status: ⚠️  WARNING");
  } else {
    console.log("   Status: 🔴 LIQUIDATION RISK");
  }
  console.log("\n");

  // 📈 6. Check user risk profile
  console.log("6️⃣ Getting user risk profile...");
  const profile = await collateralManager.read.getUserRiskProfile([account.address]);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Collateral Value: $${formatEther((profile as any)[0])}`);
  console.log(`Debt Amount: $${formatEther((profile as any)[1])}`);
  console.log(`Health Factor: ${(profile as any)[2].toString()}`);
  console.log(`Mode: ${["Flexible", "Conservative", "Freeze"][(profile as any)[3]]}`);
  console.log(`Reliable Borrower: ${(profile as any)[4] ? "✅ Yes" : "❌ No"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // 🧪 7. Simulate market conditions (owner only)
  console.log("7️⃣ Market simulation commands (owner only):");
  console.log(`
  // Simulate market volatility
  const { viem } = await network.connect();
  const oracle = await viem.getContractAt("MockOracle", "${ADDRESSES.mockOracle}");
  await oracle.write.setVolatility([80n]); // High volatility
  
  // Trigger rebalancing
  await rebalancer.write.rebalance(["${account.address}"]);
  
  // Simulate market crash
  await oracle.write.simulateCrash([
    ["${ADDRESSES.mockUSDC}", "${ADDRESSES.mockYield}"],
    30n // 30% price drop
  ]);
  `);

  console.log("\n✅ Interaction complete!");
  console.log("\n💡 Next steps:");
  console.log("   1. Uncomment borrow section to test borrowing");
  console.log("   2. Use market simulation to test protocol protection");
  console.log("   3. Check rebalancing and anti-liquidation features");
}

// Helper functions
export async function getBalances(userAddress: string) {
  // Setup viem clients
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY not set");
  
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
  
  const getContractInstance = async (name: string, address: string) => {
    const artifact = await hre.artifacts.readArtifact(name);
    return getContract({
      address: address as `0x${string}`,
      abi: artifact.abi,
      client: { public: publicClient, wallet: walletClient },
    });
  };
  
  const mockUSDC = await getContractInstance("MockUSDC", ADDRESSES.mockUSDC);
  const mockYield = await getContractInstance("MockYield", ADDRESSES.mockYield);
  const mockRWA = await getContractInstance("MockRWA", ADDRESSES.mockRWA);

  const usdcBalance = await mockUSDC.read.balanceOf([userAddress as `0x${string}`]);
  const yieldBalance = await mockYield.read.balanceOf([userAddress as `0x${string}`]);
  const rwaBalance = await mockRWA.read.balanceOf([userAddress as `0x${string}`]);

  return {
    usdcBalance: formatEther(usdcBalance as bigint),
    yieldBalance: formatEther(yieldBalance as bigint),
    rwaBalance: formatEther(rwaBalance as bigint),
  };
}

export async function checkProtectionStatus(userAddress: string) {
  // Setup viem clients
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY not set");
  
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
  
  const getContractInstance = async (name: string, address: string) => {
    const artifact = await hre.artifacts.readArtifact(name);
    return getContract({
      address: address as `0x${string}`,
      abi: artifact.abi,
      client: { public: publicClient, wallet: walletClient },
    });
  };
  
  const antiLiquidation = await getContractInstance("AntiLiquidation", ADDRESSES.antiLiquidation);
  const isProtected = await antiLiquidation.read.isProtected([userAddress as `0x${string}`]);
  
  if (isProtected) {
    const info = await antiLiquidation.read.getProtectionInfo([userAddress as `0x${string}`]);
    return {
      isProtected: true,
      activatedAt: new Date(Number(info[1]) * 1000).toISOString(),
      expiresAt: new Date(Number(info[2]) * 1000).toISOString(),
      totalSlowRepaid: formatEther(info[3]),
    };
  }
  
  return { isProtected: false };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
