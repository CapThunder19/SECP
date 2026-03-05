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
 * Whitelist new MockWBTC in SmartVault
 */
async function main() {
  console.log("🔧 Whitelisting new MockWBTC in SmartVault...\n");

  // Contract addresses
  const smartVaultAddress = "0xddcfe550d0e1fa5cc4ed34dad01741058b98411d" as `0x${string}`;
  const newMockWBTCAddress = "0x28e9e4c98f06edf54b16cbe07818b1fcbf200e86" as `0x${string}`;
  
  console.log("SmartVault address:", smartVaultAddress);
  console.log("New MockWBTC address:", newMockWBTCAddress);
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

  console.log("Transacting with account:", account.address);
  console.log();

  // Get SmartVault artifact
  const artifact = await hre.artifacts.readArtifact("SmartVault");
  
  console.log("📝 Adding new WBTC as supported token...");
  
  const hash = await walletClient.writeContract({
    address: smartVaultAddress,
    abi: artifact.abi,
    functionName: 'addSupportedToken',
    args: [newMockWBTCAddress],
  });
  
  console.log(`   ⏳ Transaction: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  if (receipt.status === 'success') {
    console.log(`   ✅ Token added successfully!\n`);
    
    // Verify it's supported
    const isSupported = await publicClient.readContract({
      address: smartVaultAddress,
      abi: artifact.abi,
      functionName: 'supportedTokens',
      args: [newMockWBTCAddress],
    });
    
    console.log(`✅ Verification: Token is supported = ${isSupported}`);
  } else {
    console.error("❌ Transaction failed");
  }
  
  console.log();
  console.log("🎉 Setup complete! Users can now:");
  console.log("   1. Mint 100 mWBTC from the faucet");
  console.log("   2. Deposit mWBTC as collateral");
  console.log("   3. Balance will display correctly in the UI");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
