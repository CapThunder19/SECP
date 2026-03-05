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
 * Whitelist mDOT in SmartVault
 */
async function main() {
  console.log("🔧 Whitelisting mDOT in SmartVault...\n");

  const mockDOTAddress = "0x375318d88b0fcaf58538cf8e3812640f38a1ff98" as `0x${string}`;
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

  console.log("Account:", account.address);
  console.log("SmartVault:", smartVaultAddress);
  console.log("mDOT:", mockDOTAddress);
  console.log();

  const artifact = await hre.artifacts.readArtifact("SmartVault");
  
  console.log("📝 Adding mDOT as supported token...");
  
  const hash = await walletClient.writeContract({
    address: smartVaultAddress,
    abi: artifact.abi,
    functionName: 'addSupportedToken',
    args: [mockDOTAddress],
  });
  
  console.log(`   ⏳ Transaction: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  if (receipt.status === 'success') {
    console.log(`   ✅ mDOT whitelisted successfully!\n`);
    
    const isSupported = await publicClient.readContract({
      address: smartVaultAddress,
      abi: artifact.abi,
      functionName: 'supportedTokens',
      args: [mockDOTAddress],
    });
    
    console.log(`✅ Verification: mDOT is supported = ${isSupported}`);
    console.log();
    console.log("🎉 You can now deposit mDOT as collateral!");
  } else {
    console.error("❌ Transaction failed");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
