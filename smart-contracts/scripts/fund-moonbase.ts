/**
 * fund-moonbase.ts - Fund LoanManager with USDC on Moonbase Alpha
 * 
 * This fixes the borrowing issue by giving the LoanManager contract
 * enough USDC tokens to lend out to borrowers.
 */

import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

// Moonbase Alpha chain config
const moonbaseAlpha = {
  id: 1287,
  name: 'Moonbase Alpha',
  nativeCurrency: { name: 'DEV', symbol: 'DEV', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.api.moonbase.moonbeam.network'] }
  },
};

// Load deployment
const deployPath = path.join(process.cwd(), 'deployments', 'moonbase-upgraded.json');
const deployment = JSON.parse(fs.readFileSync(deployPath, 'utf-8'));

const ADDRESSES = {
  mockUSDC: deployment.contracts.MockUSDC,
  loanManager: deployment.contracts.LoanManager,
  smartVault: deployment.contracts.SmartVault,
  mockOracle: deployment.contracts.MockOracle,
};

// ERC20 ABI
const ERC20_ABI = [
  {
    name: "faucet",
    type: "function",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable"
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view"
  },
] as const;

async function main() {
  console.log("\n💰 Funding LoanManager on Moonbase Alpha...\n");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not set in .env");
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

  console.log("Deployer:", account.address);
  console.log("LoanManager:", ADDRESSES.loanManager);
  console.log("USDC:", ADDRESSES.mockUSDC);
  console.log();

  // Check current balance
  const currentBalance = await publicClient.readContract({
    address: ADDRESSES.mockUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [ADDRESSES.loanManager as `0x${string}`],
  });

  console.log("Current LoanManager USDC balance:", formatUnits(currentBalance, 18), "USDC");

  // Get USDC from faucet multiple times and transfer to LoanManager
  // Faucet gives 1000 USDC per call, we'll call it 10 times to get 10,000 USDC
  const faucetAmount = parseUnits("1000", 18);
  const totalTransfer = faucetAmount * 10n; // 10,000 USDC

  console.log("\n🚰 Calling faucet to get USDC...");
  
  for (let i = 0; i < 10; i++) {
    console.log(`   Faucet call ${i + 1}/10...`);
    
    const faucetHash = await walletClient.writeContract({
      address: ADDRESSES.mockUSDC as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'faucet',
    });
    
    await publicClient.waitForTransactionReceipt({ hash: faucetHash });
  }

  console.log("   ✅ Received", formatUnits(totalTransfer, 18), "USDC from faucet");

  // Check our balance
  const ourBalance = await publicClient.readContract({
    address: ADDRESSES.mockUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  console.log("   Our balance:", formatUnits(ourBalance, 18), "USDC");

  // Transfer to LoanManager
  console.log("\n💸 Transferring USDC to LoanManager...");

  const transferAmount = ourBalance; // Transfer all we have

  const hash = await walletClient.writeContract({
    address: ADDRESSES.mockUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [ADDRESSES.loanManager as `0x${string}`, transferAmount],
  });

  console.log("   Transaction:", hash);

  await publicClient.waitForTransactionReceipt({ hash });

  // Check new balance
  const newBalance = await publicClient.readContract({
    address: ADDRESSES.mockUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [ADDRESSES.loanManager as `0x${string}`],
  });

  console.log("   ✅ New LoanManager USDC balance:", formatUnits(newBalance, 18), "USDC");
  console.log();
  console.log("✅ LoanManager is now funded and ready for borrowing!");
  console.log("\nUsers can now:");
  console.log("  1. Deposit collateral (DOT, WBTC, RWA)");
  console.log("  2. Borrow USDC against their collateral");
  console.log("  3. Use AI-powered anti-liquidation protection");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
