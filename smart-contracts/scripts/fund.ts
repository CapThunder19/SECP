/**
 * fund.ts — Fix on-chain protocol state so borrow() works
 *
 * ROOT CAUSE OF "Transaction failed on-chain":
 *   LoanManager.borrow() calls loanToken.transfer(msg.sender, amount)
 *   but the LoanManager contract has ZERO mUSDC balance → transfer fails → revert.
 *
 * This script:
 *   1. Mints 10,000,000 mUSDC directly to LoanManager (as the owner/deployer)
 *   2. Verifies supportedTokens are set in SmartVault
 *   3. Verifies oracle prices are set
 *   4. Verifies asset weights are set in CollateralManager
 *
 * Run with: npx hardhat run scripts/fund.ts --network arbitrumSepolia
 */

import hre from "hardhat";
import { createWalletClient, createPublicClient, http, getContract, parseEther, formatEther } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

const ADDRESSES = {
    mockUSDC: "0x4cb63f6ba14e54f3422e3b66955ef5ee690ae2c8",
    mockYield: "0x89fa6ae8ae17cdff1b917a31fba44f7bddcd3c62",
    mockRWA: "0x3fac055201501b26a8083761655bd1909840c454",
    mockOracle: "0x539e55d266f1ff01716432755ec31f6674e928c1",
    smartVault: "0x2e8026bc45fe0fae2b159a3c82cada12670769e2",
    loanManager: "0xba5be20d3d96e89ffbf20f9812df73cada28e376",
    collateralManager: "0xfa7e1a8e4be412b9c7efcbb5f14ddcc5820da599",
} as const;

// Minimal ABIs for the operations we need
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
    { name: "marketVolatility", type: "function", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

const COLLATERAL_ABI = [
    { name: "setAssetWeight", type: "function", inputs: [{ name: "token", type: "address" }, { name: "weight", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
    { name: "assetWeights", type: "function", inputs: [{ name: "token", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey || privateKey === "your_private_key_here") {
        throw new Error("Set PRIVATE_KEY in smart-contracts/.env");
    }

    const account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);

    const publicClient = createPublicClient({
        chain: arbitrumSepolia,
        transport: http("https://sepolia-rollup.arbitrum.io/rpc"),
    });

    const walletClient = createWalletClient({
        account,
        chain: arbitrumSepolia,
        transport: http("https://sepolia-rollup.arbitrum.io/rpc"),
    });

    const send = async (desc: string, fn: () => Promise<`0x${string}`>) => {
        process.stdout.write(`  ⏳ ${desc}... `);
        const hash = await fn();
        await publicClient.waitForTransactionReceipt({ hash });
        console.log(`✅  (${hash.slice(0, 10)}…)`);
        return hash;
    };

    const mkContract = (abi: any, address: `0x${string}`) =>
        getContract({ address, abi, client: { public: publicClient, wallet: walletClient } });

    const usdc = mkContract(ERC20_ABI, ADDRESSES.mockUSDC as `0x${string}`);
    const vault = mkContract(VAULT_ABI, ADDRESSES.smartVault as `0x${string}`);
    const oracle = mkContract(ORACLE_ABI, ADDRESSES.mockOracle as `0x${string}`);
    const collateral = mkContract(COLLATERAL_ABI, ADDRESSES.collateralManager as `0x${string}`);

    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║     SECP Protocol — Fund & Verify       ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log(`\nOwner: ${account.address}\n`);

    // ── 1. FUND LOAN MANAGER ─────────────────────────────────────
    console.log("1️⃣  FUNDING LOAN MANAGER WITH mUSDC");
    const lmBalance = await usdc.read.balanceOf([ADDRESSES.loanManager as `0x${string}`]);
    console.log(`   Current LoanManager mUSDC balance: ${formatEther(lmBalance as bigint)} mUSDC`);

    if ((lmBalance as bigint) < parseEther("1000000")) {
        await send(
            "Minting 10,000,000 mUSDC to LoanManager",
            () => usdc.write.mint([ADDRESSES.loanManager as `0x${string}`, parseEther("10000000")]) as Promise<`0x${string}`>,
        );
        const newBal = await usdc.read.balanceOf([ADDRESSES.loanManager as `0x${string}`]);
        console.log(`   ✅ New balance: ${formatEther(newBal as bigint)} mUSDC\n`);
    } else {
        console.log(`   ✅ Already funded — skipping\n`);
    }

    // ── 2. ENSURE VAULT SUPPORTS ALL TOKENS ────────────────────
    console.log("2️⃣  VAULT SUPPORTED TOKENS");
    const tokens = [
        { name: "mUSDC", addr: ADDRESSES.mockUSDC },
        { name: "mYLD", addr: ADDRESSES.mockYield },
        { name: "mRWA", addr: ADDRESSES.mockRWA },
    ] as const;

    for (const t of tokens) {
        const supported = await vault.read.supportedTokens([t.addr as `0x${string}`]);
        if (!supported) {
            await send(
                `Adding ${t.name} to vault`,
                () => vault.write.addSupportedToken([t.addr as `0x${string}`]) as Promise<`0x${string}`>,
            );
        } else {
            console.log(`  ✅ ${t.name} already supported`);
        }
    }
    console.log();

    // ── 3. ENSURE ORACLE PRICES ─────────────────────────────────
    console.log("3️⃣  ORACLE PRICES");
    const priceConfig = [
        { name: "mUSDC", addr: ADDRESSES.mockUSDC, price: parseEther("1") }, // $1.00
        { name: "mYLD", addr: ADDRESSES.mockYield, price: parseEther("1.05") }, // $1.05
        { name: "mRWA", addr: ADDRESSES.mockRWA, price: parseEther("1.5") }, // $1.50
    ] as const;

    for (const p of priceConfig) {
        const price = await oracle.read.getPrice([p.addr as `0x${string}`]);
        if ((price as bigint) === 0n) {
            await send(
                `Setting ${p.name} price to $${formatEther(p.price)}`,
                () => oracle.write.setPrice([p.addr as `0x${string}`, p.price]) as Promise<`0x${string}`>,
            );
        } else {
            console.log(`  ✅ ${p.name} price: $${formatEther(price as bigint)}`);
        }
    }

    const vol = await oracle.read.marketVolatility([]);
    if ((vol as bigint) === 0n) {
        await send("Setting market volatility to 20", () => oracle.write.setVolatility([20n]) as Promise<`0x${string}`>);
    } else {
        console.log(`  ✅ Volatility already set: ${vol}`);
    }
    console.log();

    // ── 4. ENSURE ASSET WEIGHTS ─────────────────────────────────
    console.log("4️⃣  COLLATERAL ASSET WEIGHTS");
    const weightConfig = [
        { name: "mUSDC", addr: ADDRESSES.mockUSDC, weight: 90n },
        { name: "mYLD", addr: ADDRESSES.mockYield, weight: 80n },
        { name: "mRWA", addr: ADDRESSES.mockRWA, weight: 100n },
    ] as const;

    for (const w of weightConfig) {
        const weight = await collateral.read.assetWeights([w.addr as `0x${string}`]);
        if ((weight as bigint) === 0n) {
            await send(
                `Setting ${w.name} weight to ${w.weight}%`,
                () => collateral.write.setAssetWeight([w.addr as `0x${string}`, w.weight]) as Promise<`0x${string}`>,
            );
        } else {
            console.log(`  ✅ ${w.name} weight: ${weight}%`);
        }
    }

    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║          Setup Complete! 🎉              ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log("\nThe LoanManager now has 10M mUSDC to lend.");
    console.log("Users can now successfully borrow!\n");
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("\n❌ Error:", err.message ?? err);
        process.exit(1);
    });
