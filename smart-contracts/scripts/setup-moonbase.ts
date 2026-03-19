/**
 * setup-moonbase.ts — Configure SECP Protocol on Moonbase Alpha
 * 
 * This script:
 * 1. Adds supported tokens to SmartVault (REQUIRED for deposits to work)
 * 2. Sets oracle prices for all tokens
 * 3. Sets asset weights in CollateralManager
 * 4. Funds LoanManager with mUSDC so users can borrow
 * 
 * Run with: npx hardhat run scripts/setup-moonbase.ts --network moonbaseAlpha
 */

import hre from "hardhat";
import { createWalletClient, createPublicClient, http, getContract, parseEther, formatEther } from "viem";
import { moonbaseAlpha } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

// Moonbase Alpha deployment addresses
const ADDRESSES = {
    mockUSDC: "0x6487ed309006ce5c94d03f428476b30f9b8b787c",
    mockYield: "0x7f049d2dec7b1e1d3b6c50998ad7e69e1ecc8220",
    mockRWA: "0x6398277dd089c4c470e8fca6f2cd6224a18186e1",
    mockDOT: "0x3b1d6b1c0a067dd74f60a480ec5b6b6bb7cad470",
    mockWBTC: "0xfde4bc6c775fb0387b1e9b30d9d872bf01d001c5",
    mockOracle: "0x8236e5c95821cec3cb1d39da443c399e829f8d5b",
    smartVault: "0x25c7c2d7cae8bf5ca240345e9183f6c9fe5cd2ce",
    loanManager: "0xb1e33643ade11a0010f5a0e74b4d827c961b56cd",
    collateralManager: "0xae216ee7f1fe422abf8230b4805fe559e97c035d",
} as const;

// Minimal ABIs for setup
const ERC20_ABI = [
    { name: "mint", type: "function", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
    { name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

const VAULT_ABI = [
    { name: "addSupportedToken", type: "function", inputs: [{ name: "token", type: "address" }], outputs: [], stateMutability: "nonpayable" },
    { name: "supportedTokens", type: "function", inputs: [{ name: "token", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
] as const;

const ORACLE_ABI = [
    { name: "setPrice", type: "function", inputs: [{ name: "token", type: "address" }, { name: "price", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
    { name: "getPrice", type: "function", inputs: [{ name: "token", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
    { name: "setVolatility", type: "function", inputs: [{ name: "vol", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const;

const COLLATERAL_ABI = [
    { name: "setAssetWeight", type: "function", inputs: [{ name: "token", type: "address" }, { name: "weight", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
    { name: "assetWeights", type: "function", inputs: [{ name: "token", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey || privateKey === "your_private_key_here") {
        throw new Error("❌ Set PRIVATE_KEY in smart-contracts/.env");
    }

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

    const send = async (desc: string, fn: () => Promise<`0x${string}`>) => {
        process.stdout.write(`  ⏳ ${desc}... `);
        try {
            const hash = await fn();
            await publicClient.waitForTransactionReceipt({ hash, confirmations: 2 });
            console.log(`✅  tx: ${hash.slice(0, 12)}…`);
            return hash;
        } catch (err: any) {
            console.log(`❌  ${err.message.slice(0, 60)}`);
            throw err;
        }
    };

    const mkContract = (abi: any, address: `0x${string}`) =>
        getContract({ address, abi, client: { public: publicClient, wallet: walletClient } });

    const usdc = mkContract(ERC20_ABI, ADDRESSES.mockUSDC as `0x${string}`);
    const vault = mkContract(VAULT_ABI, ADDRESSES.smartVault as `0x${string}`);
    const oracle = mkContract(ORACLE_ABI, ADDRESSES.mockOracle as `0x${string}`);
    const collateral = mkContract(COLLATERAL_ABI, ADDRESSES.collateralManager as `0x${string}`);

    console.log("\n╔═══════════════════════════════════════════════╗");
    console.log("║   SECP Protocol Setup — Moonbase Alpha       ║");
    console.log("╚═══════════════════════════════════════════════╝");
    console.log(`\n🔑 Deployer: ${account.address}`);
    console.log(`⛓️  Network: Moonbase Alpha (Chain ID 1287)\n`);

    // ── 1. ADD SUPPORTED TOKENS TO VAULT ────────────────────────
    console.log("1️⃣  CONFIGURING VAULT SUPPORTED TOKENS");
    const tokens = [
        { name: "mUSDC", addr: ADDRESSES.mockUSDC },
        { name: "mYield", addr: ADDRESSES.mockYield },
        { name: "mRWA", addr: ADDRESSES.mockRWA },
        { name: "mDOT", addr: ADDRESSES.mockDOT },
        { name: "mWBTC", addr: ADDRESSES.mockWBTC },
    ] as const;

    for (const t of tokens) {
        const supported = await vault.read.supportedTokens([t.addr as `0x${string}`]);
        if (!supported) {
            await send(
                `Adding ${t.name} to SmartVault`,
                () => vault.write.addSupportedToken([t.addr as `0x${string}`]) as Promise<`0x${string}`>,
            );
        } else {
            console.log(`  ✅ ${t.name} already supported`);
        }
    }
    console.log();

    // ── 2. SET ORACLE PRICES ────────────────────────────────────
    console.log("2️⃣  SETTING ORACLE PRICES");
    const priceConfig = [
        { name: "mUSDC", addr: ADDRESSES.mockUSDC, price: parseEther("1") },       // $1.00
        { name: "mYield", addr: ADDRESSES.mockYield, price: parseEther("1.05") },  // $1.05
        { name: "mRWA", addr: ADDRESSES.mockRWA, price: parseEther("1.5") },      // $1.50
        { name: "mDOT", addr: ADDRESSES.mockDOT, price: parseEther("6.0") },
        { name: "mWBTC", addr: ADDRESSES.mockWBTC, price: parseEther("60000.0") },
    ] as const;

    for (const p of priceConfig) {
        const price = await oracle.read.getPrice([p.addr as `0x${string}`]);
        if ((price as bigint) === 0n) {
            await send(
                `Setting ${p.name} = $${formatEther(p.price)}`,
                () => oracle.write.setPrice([p.addr as `0x${string}`, p.price]) as Promise<`0x${string}`>,
            );
        } else {
            console.log(`  ✅ ${p.name} price already set: $${formatEther(price as bigint)}`);
        }
    }

    // Set market volatility
    const vol = 20n; // Low volatility
    await send("Setting market volatility to 20", () => oracle.write.setVolatility([vol]) as Promise<`0x${string}`>);
    console.log();

    // ── 3. SET ASSET WEIGHTS ────────────────────────────────────
    console.log("3️⃣  SETTING COLLATERAL WEIGHTS");
    const weightConfig = [
        { name: "mUSDC", addr: ADDRESSES.mockUSDC, weight: 90n },   // 90% collateral value
        { name: "mYield", addr: ADDRESSES.mockYield, weight: 75n }, // 75% collateral value
        { name: "mRWA", addr: ADDRESSES.mockRWA, weight: 80n },    // 80% collateral value
        { name: "mDOT", addr: ADDRESSES.mockDOT, weight: 85n },
        { name: "mWBTC", addr: ADDRESSES.mockWBTC, weight: 90n },
    ] as const;

    for (const w of weightConfig) {
        const weight = await collateral.read.assetWeights([w.addr as `0x${string}`]);
        if ((weight as bigint) === 0n) {
            await send(
                `Setting ${w.name} weight = ${w.weight}%`,
                () => collateral.write.setAssetWeight([w.addr as `0x${string}`, w.weight]) as Promise<`0x${string}`>,
            );
        } else {
            console.log(`  ✅ ${w.name} weight already set: ${weight}%`);
        }
    }
    console.log();

    // ── 4. FUND LOAN MANAGER ────────────────────────────────────
    console.log("4️⃣  FUNDING LOAN MANAGER");
    const lmBalance = await usdc.read.balanceOf([ADDRESSES.loanManager as `0x${string}`]);
    console.log(`   Current LoanManager balance: ${formatEther(lmBalance as bigint)} mUSDC`);

    if ((lmBalance as bigint) < parseEther("100000")) {
        await send(
            "Minting 10,000,000 mUSDC to LoanManager",
            () => usdc.write.mint([ADDRESSES.loanManager as `0x${string}`, parseEther("10000000")]) as Promise<`0x${string}`>,
        );
        const newBal = await usdc.read.balanceOf([ADDRESSES.loanManager as `0x${string}`]);
        console.log(`   ✅ New balance: ${formatEther(newBal as bigint)} mUSDC`);
    } else {
        console.log(`   ✅ LoanManager already funded`);
    }

    console.log("\n╔═══════════════════════════════════════════════╗");
    console.log("║          ✅ SETUP COMPLETE!                   ║");
    console.log("╚═══════════════════════════════════════════════╝");
    console.log("\n📝 Next steps:");
    console.log("  1. Deposits should now work in the frontend");
    console.log("  2. Users can claim faucet tokens");
    console.log("  3. Borrowing will work once deposits are made\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
