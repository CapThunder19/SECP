/**
 * test-deposit.ts — Test deposit flow on Moonbase Alpha
 * 
 * This script simulates the exact deposit flow from the frontend:
 * 1. Approve SmartVault to spend tokens
 * 2. Call deposit on SmartVault
 */

import { createWalletClient, createPublicClient, http, parseEther, formatEther } from "viem";
import { moonbaseAlpha } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

const ADDRESSES = {
    mockUSDC: "0x2910009bb55f0f1efc4408f1b794600ac529bcc3",
    smartVault: "0x9ac3a6ba0a9459994aa6c568ae19920138487fca",
} as const;

const ERC20_ABI = [
    { name: "approve", type: "function", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
    { name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
    { name: "allowance", type: "function", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

const VAULT_ABI = [
    { name: "deposit", type: "function", inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
    { name: "supportedTokens", type: "function", inputs: [{ name: "token", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
    { name: "getCollateral", type: "function", inputs: [{ name: "user", type: "address" }, { name: "token", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("Set PRIVATE_KEY in .env");

    const account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);
    
    const publicClient = createPublicClient({
        chain: moonbaseAlpha,
        transport: http("https://rpc.api.moonbase.moonbeam.network"),
    });

    const walletClient = createWalletClient({
        account,
        chain: moonbaseAlpha,
        transport: http("https://rpc.api.moonbase.moonbeam.network"),
    });

    console.log("\n╔═══════════════════════════════════════════════╗");
    console.log("║       Test Deposit Flow — Moonbase Alpha     ║");
    console.log("╚═══════════════════════════════════════════════╝");
    console.log(`\n🔑 User: ${account.address}\n`);

    const depositAmount = parseEther("10"); // 10 mUSDC

    // Check token balance
    console.log("1️⃣  Checking token balance...");
    const balance = await publicClient.readContract({
        address: ADDRESSES.mockUSDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
    });
    console.log(`   Balance: ${formatEther(balance)} mUSDC`);
    
    if (balance < depositAmount) {
        console.log("   ❌ Insufficient balance. Run faucet first!");
        console.log("   Hint: Call mockUSDC.faucet() to get 1000 mUSDC\n");
        return;
    }

    // Check if token is supported
    console.log("\n2️⃣  Checking if token is supported...");
    const supported = await publicClient.readContract({
        address: ADDRESSES.smartVault as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "supportedTokens",
        args: [ADDRESSES.mockUSDC as `0x${string}`],
    });
    console.log(`   Supported: ${supported ? "✅ Yes" : "❌ No"}`);
    
    if (!supported) {
        console.log("   ❌ Token not supported! Run setup-moonbase.ts first\n");
        return;
    }

    // Check current allowance
    console.log("\n3️⃣  Checking current allowance...");
    const allowance = await publicClient.readContract({
        address: ADDRESSES.mockUSDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [account.address, ADDRESSES.smartVault as `0x${string}`],
    });
    console.log(`   Current allowance: ${formatEther(allowance)} mUSDC`);

    // Step 1: Approve
    if (allowance < depositAmount) {
        console.log("\n4️⃣  Approving SmartVault...");
        try {
            const approveTx = await walletClient.writeContract({
                address: ADDRESSES.mockUSDC as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [ADDRESSES.smartVault as `0x${string}`, depositAmount],
            });
            console.log(`   Tx submitted: ${approveTx}`);
            await publicClient.waitForTransactionReceipt({ hash: approveTx, confirmations: 2 });
            console.log("   ✅ Approval confirmed");
        } catch (err: any) {
            console.log(`   ❌ Approval failed: ${err.message}`);
            throw err;
        }
    } else {
        console.log("\n4️⃣  Already approved ✅");
    }

    // Step 2: Deposit
    console.log("\n5️⃣  Depositing to SmartVault...");
    try {
        const depositTx = await walletClient.writeContract({
            address: ADDRESSES.smartVault as `0x${string}`,
            abi: VAULT_ABI,
            functionName: "deposit",
            args: [ADDRESSES.mockUSDC as `0x${string}`, depositAmount],
        });
        console.log(`   Tx submitted: ${depositTx}`);
        
        const receipt = await publicClient.waitForTransactionReceipt({ 
            hash: depositTx, 
            confirmations: 2 
        });
        
        if (receipt.status === "success") {
            console.log("   ✅ Deposit successful!");
        } else {
            console.log("   ❌ Deposit transaction reverted");
        }
    } catch (err: any) {
        console.log(`   ❌ Deposit failed: ${err.message}`);
        console.log("\n   Full error:");
        console.log(err);
        throw err;
    }

    // Check new collateral balance
    console.log("\n6️⃣  Checking collateral balance...");
    const collateral = await publicClient.readContract({
        address: ADDRESSES.smartVault as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "getCollateral",
        args: [account.address, ADDRESSES.mockUSDC as `0x${string}`],
    });
    console.log(`   Collateral: ${formatEther(collateral)} mUSDC`);

    console.log("\n" + "═".repeat(50));
    console.log("✅ Test complete!");
    console.log("═".repeat(50) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Test failed");
        process.exit(1);
    });
