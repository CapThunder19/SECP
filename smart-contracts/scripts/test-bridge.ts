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
 * Test cross-chain deposit from Sepolia to Moonbase
 * This simulates a user depositing tokens that will be bridged
 */
async function main() {
  console.log("🧪 Testing Cross-Chain Bridge\n");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Please set PRIVATE_KEY in .env file");
  }

  const account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);
  
  // Setup Moonbase client with timeout configuration
  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(undefined, {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  });

  const walletClient = createWalletClient({
    account,
    chain: moonbaseAlpha,
    transport: http(undefined, {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  });

  console.log("User Address:", account.address);
  console.log();

  // Contract addresses
  const xcmBridgeAddress = "0x8d090e8e2f2fcacca6c952e75f1f2ed224c59cef" as `0x${string}`;
  const mockDOTAddress = "0x375318d88b0fcaf58538cf8e3812640f38a1ff98" as `0x${string}`;

  console.log("XCM Bridge:", xcmBridgeAddress);
  console.log("Mock DOT:", mockDOTAddress);
  console.log();

  // Get artifacts
  const bridgeArtifact = await hre.artifacts.readArtifact("XCMBridge");
  const tokenArtifact = await hre.artifacts.readArtifact("MockDOT");

  // Step 1: Check token balance
  console.log("Step 1: Checking token balance...");
  const balance = await publicClient.readContract({
    address: mockDOTAddress,
    abi: tokenArtifact.abi,
    functionName: 'balanceOf',
    args: [account.address],
  }) as bigint;

  console.log(`   Balance: ${(Number(balance) / 1e18).toFixed(4)} mDOT`);

  // Deposit amount
  const depositAmount = 10n * 10n**18n; // 10 DOT

  if (balance < depositAmount) {
    console.log("\n   ⚠️  Insufficient balance! Minting 100 DOT from faucet...");
    const mintHash = await walletClient.writeContract({
      address: mockDOTAddress,
      abi: tokenArtifact.abi,
      functionName: 'faucet',
    });
    await publicClient.waitForTransactionReceipt({ hash: mintHash });
    console.log("   ✅ Minted 100 mDOT\n");
  } else {
    console.log();
  }

  // Step 2: Approve tokens
  console.log("Step 2: Approving bridge to spend tokens...");
  const approveHash = await walletClient.writeContract({
    address: mockDOTAddress,
    abi: tokenArtifact.abi,
    functionName: 'approve',
    args: [xcmBridgeAddress, depositAmount],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  console.log("   ✅ Approved\n");

  // Step 3: Transfer tokens to bridge (simulating lock on source chain)
  console.log("Step 3: Transferring tokens to bridge (simulating source chain lock)...");
  const transferHash = await walletClient.writeContract({
    address: mockDOTAddress,
    abi: tokenArtifact.abi,
    functionName: 'transfer',
    args: [xcmBridgeAddress, depositAmount],
  });
  await publicClient.waitForTransactionReceipt({ hash: transferHash });
  console.log("   ✅ Transferred 10 mDOT to bridge\n");

  // Step 4: Initiate cross-chain deposit (simulating deposit from Acala)
  console.log("Step 4: Initiating cross-chain deposit...");
  console.log("   Simulating deposit from: Acala (Chain ID 2)");
  console.log("   Amount: 10 mDOT");
  console.log();

  const depositHash = await walletClient.writeContract({
    address: xcmBridgeAddress,
    abi: bridgeArtifact.abi,
    functionName: 'initiateCrossChainDeposit',
    args: [
      account.address,    // user
      mockDOTAddress,     // token
      depositAmount,      // amount
      2                   // sourceChain: 2 = Acala
    ],
  });

  console.log("   ⏳ Transaction:", depositHash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: depositHash });

  if (receipt.status === 'success') {
    // Extract deposit ID from logs
    const log = receipt.logs.find((l: any) => 
      l.topics[0] === '0x4d7dbdcc249630ec373f584267f10abf44938de920c32562f5aee93959c25754'
    );
    
    if (log) {
      const depositId = log.topics[1];
      console.log("   ✅ Cross-chain deposit initiated!");
      console.log("   📋 Deposit ID:", depositId);
      console.log();
      console.log("🎉 SUCCESS!");
      console.log();
      console.log("Next steps:");
      console.log("1. The bridge relayer will automatically detect this deposit");
      console.log("2. After ~5 seconds (simulating XCM message time), it will complete the deposit");
      console.log("3. Your collateral will be credited to SmartVault");
      console.log("4. You can then borrow against it!");
      console.log();
      console.log("👀 Watch the relayer terminal for the completion message");
    } else {
      console.log("   ✅ Deposit initiated (no event found in logs)");
    }
  } else {
    console.log("   ❌ Transaction failed");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
