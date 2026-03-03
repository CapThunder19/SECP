/**
 * verify-moonbase.ts — Check if Moonbase Alpha setup is complete
 * 
 * This script verifies:
 * 1. Are tokens added to SmartVault supportedTokens?
 * 2. Are oracle prices set?
 * 3. Are asset weights configured?
 * 4. Is LoanManager funded with USDC?
 */

import { createPublicClient, http, formatEther } from "viem";
import { moonbaseAlpha } from "viem/chains";

const ADDRESSES = {
    mockUSDC: "0x2910009bb55f0f1efc4408f1b794600ac529bcc3",
    mockYield: "0x90c5f5af3086655d10e3daa70c97e8f605a333c8",
    mockRWA: "0xc500240db43ef946eb0fed6c2f3c80a2d5195a8e",
    mockOracle: "0x2431412258006a6f49b4f3361767427c3cbc3532",
    smartVault: "0x9ac3a6ba0a9459994aa6c568ae19920138487fca",
    loanManager: "0xcb29fec76ff9a4e7432b5f725b16aad190a0cc26",
    collateralManager: "0xfd46da485e35732d802325d31534ba34d0335033",
} as const;

const VAULT_ABI = [
    { name: "supportedTokens", type: "function", inputs: [{ name: "token", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
] as const;

const ORACLE_ABI = [
    { name: "getPrice", type: "function", inputs: [{ name: "token", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

const COLLATERAL_ABI = [
    { name: "assetWeights", type: "function", inputs: [{ name: "token", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

const ERC20_ABI = [
    { name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

async function main() {
    const publicClient = createPublicClient({
        chain: moonbaseAlpha,
        transport: http("https://rpc.api.moonbase.moonbeam.network"),
    });

    console.log("\n╔═══════════════════════════════════════════════╗");
    console.log("║   Moonbase Alpha Protocol Verification       ║");
    console.log("╚═══════════════════════════════════════════════╝\n");

    let issues = 0;

    // 1. Check SmartVault supported tokens
    console.log("1️⃣  SmartVault Supported Tokens:");
    const tokens = [
        { name: "mUSDC", addr: ADDRESSES.mockUSDC },
        { name: "mYield", addr: ADDRESSES.mockYield },
        { name: "mRWA", addr: ADDRESSES.mockRWA },
    ];

    for (const t of tokens) {
        try {
            const supported = await publicClient.readContract({
                address: ADDRESSES.smartVault as `0x${string}`,
                abi: VAULT_ABI,
                functionName: "supportedTokens",
                args: [t.addr as `0x${string}`],
            });
            if (supported) {
                console.log(`   ✅ ${t.name} is supported`);
            } else {
                console.log(`   ❌ ${t.name} is NOT supported — deposits will fail!`);
                issues++;
            }
        } catch (err) {
            console.log(`   ⚠️  ${t.name} check failed: ${(err as any).message.slice(0, 50)}`);
            issues++;
        }
    }

    // 2. Check Oracle prices
    console.log("\n2️⃣  Oracle Prices:");
    for (const t of tokens) {
        try {
            const price = await publicClient.readContract({
                address: ADDRESSES.mockOracle as `0x${string}`,
                abi: ORACLE_ABI,
                functionName: "getPrice",
                args: [t.addr as `0x${string}`],
            });
            if (price > 0n) {
                console.log(`   ✅ ${t.name} = $${formatEther(price)}`);
            } else {
                console.log(`   ❌ ${t.name} price is $0 — deposits may not show correct value`);
                issues++;
            }
        } catch (err) {
            console.log(`   ⚠️  ${t.name} price check failed`);
        }
    }

    // 3. Check Asset Weights
    console.log("\n3️⃣  Collateral Asset Weights:");
    for (const t of tokens) {
        try {
            const weight = await publicClient.readContract({
                address: ADDRESSES.collateralManager as `0x${string}`,
                abi: COLLATERAL_ABI,
                functionName: "assetWeights",
                args: [t.addr as `0x${string}`],
            });
            if (weight > 0n) {
                console.log(`   ✅ ${t.name} weight = ${weight}%`);
            } else {
                console.log(`   ❌ ${t.name} weight is 0% — collateral value will be $0`);
                issues++;
            }
        } catch (err) {
            console.log(`   ⚠️  ${t.name} weight check failed`);
        }
    }

    // 4. Check LoanManager balance
    console.log("\n4️⃣  LoanManager USDC Balance:");
    try {
        const balance = await publicClient.readContract({
            address: ADDRESSES.mockUSDC as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [ADDRESSES.loanManager as `0x${string}`],
        });
        console.log(`   Balance: ${formatEther(balance)} mUSDC`);
        if (balance < 100000n * 10n ** 18n) {
            console.log(`   ⚠️  Low balance — borrowing may fail if many users borrow`);
        } else {
            console.log(`   ✅ LoanManager has sufficient funds`);
        }
    } catch (err) {
        console.log(`   ⚠️  Balance check failed`);
    }

    console.log("\n" + "═".repeat(50));
    if (issues === 0) {
        console.log("✅ All checks passed! Protocol is ready for deposits.");
    } else {
        console.log(`❌ Found ${issues} issue(s). Run setup-moonbase.ts to fix.`);
        console.log("\n🔧 Fix command:");
        console.log("   npx hardhat run scripts/setup-moonbase.ts --network moonbaseAlpha");
    }
    console.log("═".repeat(50) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Verification failed:", error.message);
        process.exit(1);
    });
