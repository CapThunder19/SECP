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
 * Whitelist all remaining tokens
 */
async function main() {
  console.log("🔧 Whitelisting remaining tokens...\n");

  const tokens = [
    { name: "mRWA", address: "0xdbd06fa5936b2d6ccce8fb269d59b400ff73e6ec" as `0x${string}` },
    { name: "mYLD", address: "0x308dccae804cb81d74bc02ff1ddaf7c6bcfb3fe0" as `0x${string}` },
  ];
  
  const smartVaultAddress = "0xddcfe550d0e1fa5cc4ed34dad01741058b98411d" as `0x${string}`;
  
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

  const artifact = await hre.artifacts.readArtifact("SmartVault");
  
  for (const token of tokens) {
    console.log(`\n📝 Whitelisting ${token.name}...`);
    console.log(`   Address: ${token.address}`);
    
    // Check if already whitelisted
    const isSupported = await publicClient.readContract({
      address: smartVaultAddress,
      abi: artifact.abi,
      functionName: 'supportedTokens',
      args: [token.address],
    });
    
    if (isSupported) {
      console.log(`   ✓ Already whitelisted, skipping`);
      continue;
    }
    
    const hash = await walletClient.writeContract({
      address: smartVaultAddress,
      abi: artifact.abi,
      functionName: 'addSupportedToken',
      args: [token.address],
    });
    
    console.log(`   ⏳ Transaction: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === 'success') {
      console.log(`   ✅ ${token.name} whitelisted successfully!`);
    } else {
      console.error(`   ❌ Failed to whitelist ${token.name}`);
    }
  }
  
  console.log("\n🎉 All tokens configured!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
