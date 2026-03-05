import hre from "hardhat";
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

// Define Moonbase Alpha chain
const moonbaseAlpha = defineChain({
  id: 1287,
  name: 'Moonbase Alpha',
  nativeCurrency: { name: 'DEV', symbol: 'DEV', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.api.moonbase.moonbeam.network'] }
  },
  blockExplorers: {
    default: { name: 'Moonscan', url: 'https://moonbase.moonscan.io' }
  }
});

/**
 * Configure new MockWBTC in Oracle and CollateralManager
 */
async function main() {
  console.log("🔧 Configuring new MockWBTC...\n");

  // Contract addresses
  const newMockWBTCAddress = "0x28e9e4c98f06edf54b16cbe07818b1fcbf200e86" as `0x${string}`;
  const mockOracleAddress = "0x33f27f3ec5f0e48bdf3aa8d35204e94e742fc585" as `0x${string}`;
  const collateralManagerAddress = "0x49a369a90e490506b89ad2bf4546fb68521036cc" as `0x${string}`;
  
  console.log("MockWBTC address:", newMockWBTCAddress);
  console.log("MockOracle address:", mockOracleAddress);
  console.log("CollateralManager address:", collateralManagerAddress);
  console.log();

  // Setup viem clients
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === "your_private_key_here") {
    throw new Error("Please set PRIVATE_KEY in .env file");
  }

  const account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);
  
  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: moonbaseAlpha,
    transport: http(),
  });

  console.log("Configuring with account:", account.address);
  console.log();

  // Get artifacts
  const oracleArtifact = await hre.artifacts.readArtifact("MockOracle");
  const collateralManagerArtifact = await hre.artifacts.readArtifact("CollateralManager");
  
  // Step 1: Set price in Oracle
  // WBTC price: ~$60,000 (using 1e18 format: $60,000 = 60000 * 1e18)
  const wbtcPrice = 60000n * 10n**18n;
  
  console.log("📊 Step 1: Setting WBTC price in Oracle...");
  console.log(`   Price: $60,000 (${wbtcPrice})`);
  
  const setPriceHash = await walletClient.writeContract({
    address: mockOracleAddress,
    abi: oracleArtifact.abi,
    functionName: 'setPrice',
    args: [newMockWBTCAddress, wbtcPrice],
  });
  
  console.log(`   ⏳ Transaction: ${setPriceHash}`);
  const priceReceipt = await publicClient.waitForTransactionReceipt({ hash: setPriceHash });
  
  if (priceReceipt.status === 'success') {
    console.log(`   ✅ Price set successfully!\n`);
    
    // Verify
    const currentPrice = await publicClient.readContract({
      address: mockOracleAddress,
      abi: oracleArtifact.abi,
      functionName: 'getPrice',
      args: [newMockWBTCAddress],
    });
    
    console.log(`   Verification: Current price = ${currentPrice} (${Number(currentPrice) / 1e18})\n`);
  } else {
    console.error("   ❌ Setting price failed\n");
    return;
  }
  
  // Step 2: Set asset weight in CollateralManager
  // WBTC weight: 90 (90% risk-adjusted value - highly liquid blue chip asset)
  const wbtcWeight = 90n;
  
  console.log("⚖️  Step 2: Setting WBTC asset weight in CollateralManager...");
  console.log(`   Weight: ${wbtcWeight}% (90% risk-adjusted value)`);
  
  const setWeightHash = await walletClient.writeContract({
    address: collateralManagerAddress,
    abi: collateralManagerArtifact.abi,
    functionName: 'setAssetWeight',
    args: [newMockWBTCAddress, wbtcWeight],
  });
  
  console.log(`   ⏳ Transaction: ${setWeightHash}`);
  const weightReceipt = await publicClient.waitForTransactionReceipt({ hash: setWeightHash });
  
  if (weightReceipt.status === 'success') {
    console.log(`   ✅ Asset weight set successfully!\n`);
    
    // Verify
    const currentWeight = await publicClient.readContract({
      address: collateralManagerAddress,
      abi: collateralManagerArtifact.abi,
      functionName: 'assetWeights',
      args: [newMockWBTCAddress],
    });
    
    console.log(`   Verification: Current weight = ${currentWeight}%\n`);
  } else {
    console.error("   ❌ Setting asset weight failed\n");
    return;
  }
  
  console.log("🎉 Configuration complete!");
  console.log();
  console.log("✅ New MockWBTC is now fully configured:");
  console.log("   • Whitelisted in SmartVault");
  console.log("   • Price set to $60,000 in Oracle");
  console.log("   • Risk weight set to 90% in CollateralManager");
  console.log();
  console.log("Users can now:");
  console.log("   1. Mint 100 mWBTC from faucet");
  console.log("   2. Deposit mWBTC as collateral");
  console.log("   3. Borrow against mWBTC (90% risk-adjusted LTV)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
