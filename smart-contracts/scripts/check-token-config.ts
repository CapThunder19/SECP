import hre from "hardhat";
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

const moonbaseAlpha = defineChain({
  id: 1287,
  name: 'Moonbase Alpha',
  nativeCurrency: { name: 'DEV', symbol: 'DEV', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.api.moonbase.moonbeam.network'] }
  },
});

/**
 * Check token configuration
 */
async function main() {
  console.log("🔍 Checking token configuration...\n");

  const mockDOTAddress = "0x375318d88b0fcaf58538cf8e3812640f38a1ff98" as `0x${string}`;
  const mockOracleAddress = "0x33f27f3ec5f0e48bdf3aa8d35204e94e742fc585" as `0x${string}`;
  const collateralManagerAddress = "0x49a369a90e490506b89ad2bf4546fb68521036cc" as `0x${string}`;
  const smartVaultAddress = "0xddcfe550d0e1fa5cc4ed34dad01741058b98411d" as `0x${string}`;
  
  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(),
  });

  const oracleArtifact = await hre.artifacts.readArtifact("MockOracle");
  const collateralManagerArtifact = await hre.artifacts.readArtifact("CollateralManager");
  const vaultArtifact = await hre.artifacts.readArtifact("SmartVault");
  
  console.log("Checking mDOT:", mockDOTAddress);
  console.log();
  
  // Check if whitelisted in SmartVault
  const isSupported = await publicClient.readContract({
    address: smartVaultAddress,
    abi: vaultArtifact.abi,
    functionName: 'supportedTokens',
    args: [mockDOTAddress],
  });
  console.log("✓ Supported in SmartVault:", isSupported);
  
  // Check price in Oracle
  const price = await publicClient.readContract({
    address: mockOracleAddress,
    abi: oracleArtifact.abi,
    functionName: 'getPrice',
    args: [mockDOTAddress],
  });
  console.log("✓ Price in Oracle:", price, `($${Number(price) / 1e18})`);
  
  // Check weight in CollateralManager
  const weight = await publicClient.readContract({
    address: collateralManagerAddress,
    abi: collateralManagerArtifact.abi,
    functionName: 'assetWeights',
    args: [mockDOTAddress],
  });
  console.log("✓ Asset weight:", weight, `(${weight}%)`);
  
  console.log();
  
  if (!isSupported) {
    console.log("❌ mDOT is NOT whitelisted in SmartVault!");
  }
  if (price === 0n) {
    console.log("❌ mDOT has NO price set in Oracle!");
  }
  if (weight === 0n) {
    console.log("❌ mDOT has NO weight set in CollateralManager!");
  }
  
  if (isSupported && price > 0n && weight > 0n) {
    console.log("✅ mDOT is fully configured!");
  } else {
    console.log("⚠️  mDOT needs configuration to work properly");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
