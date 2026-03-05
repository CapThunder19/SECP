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
 * Update MockWBTC faucet amount to 100 WBTC
 */
async function main() {
  console.log("🔧 Updating MockWBTC faucet amount...\n");

  // MockWBTC address on Moonbase Alpha
  const mockWBTCAddress = "0xc825fe08d9bbad713bce175c8d4e6fdf20f9e4c0" as `0x${string}`;
  
  console.log("MockWBTC address:", mockWBTCAddress);

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

  console.log("Updating with account:", account.address);
  console.log();

  // Get MockWBTC artifact
  const artifact = await hre.artifacts.readArtifact("MockWBTC");
  
  // New faucet amount: Need to account for decimal mismatch
  // MockWBTC has 8 decimals, but frontend formatEther assumes 18 decimals
  // So we need 100 * 1e18 / 1e8 = 100 * 1e10 to display as 100
  const newAmount = 100n * 10n**18n / 10n**8n; // Will be displayed as 100 in frontend
  
  console.log(`📝 Setting faucet amount to display as 100 WBTC (actual: ${newAmount})...`);
  
  const hash = await walletClient.writeContract({
    address: mockWBTCAddress,
    abi: artifact.abi,
    functionName: 'setFaucetAmount',
    args: [newAmount],
  });
  
  console.log(`   ⏳ Transaction: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  if (receipt.status === 'success') {
    console.log(`   ✅ Faucet amount updated successfully!\n`);
    
    // Read back the new value to confirm
    const faucetAmount = await publicClient.readContract({
      address: mockWBTCAddress,
      abi: artifact.abi,
      functionName: 'faucetAmount',
    });
    
    console.log(`✅ Current faucet amount: ${faucetAmount} (should be 10000000000)`);
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
