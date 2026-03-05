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
 * Redeploy MockWBTC with 18 decimals
 */
async function main() {
  console.log("🚀 Redeploying MockWBTC with 18 decimals...\n");

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

  console.log("Deploying with account:", account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Account balance:", balance.toString());
  console.log();

  // Deploy MockWBTC
  console.log("📦 Deploying MockWBTC...");
  const artifact = await hre.artifacts.readArtifact("MockWBTC");
  
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
    args: [],
  });
  
  console.log(`   ⏳ Transaction: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  if (!receipt.contractAddress) {
    throw new Error("Failed to deploy MockWBTC");
  }
  
  console.log(`   ✅ MockWBTC deployed at: ${receipt.contractAddress}\n`);
  
  // Read decimals to verify
  const decimals = await publicClient.readContract({
    address: receipt.contractAddress,
    abi: artifact.abi,
    functionName: 'decimals',
  });
  
  console.log(`✅ Decimals: ${decimals} (should be 18)`);
  
  // Read faucet amount
  const faucetAmount = await publicClient.readContract({
    address: receipt.contractAddress,
    abi: artifact.abi,
    functionName: 'faucetAmount',
  });
  
  console.log(`✅ Faucet amount: ${faucetAmount} (100 * 1e18)`);
  console.log();
  console.log("🎉 Deployment complete!");
  console.log();
  console.log("📝 Update frontend/src/config/contracts.ts with new address:");
  console.log(`   mockWBTC: "${receipt.contractAddress}",`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
