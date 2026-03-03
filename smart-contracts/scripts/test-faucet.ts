/**
 * Test Moonbase Alpha Faucet
 * Verifies that deployed contracts are accessible and faucet function works
 */

import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';

dotenv.config();

// Moonbase Alpha configuration
const MOONBASE_RPC = 'https://rpc.api.moonbase.moonbeam.network';
const CHAIN_ID = 1287;

// Deployed contract addresses from deployments/undefined-1772559874485.json
const CONTRACTS = {
  MockUSDC: '0x2910009bb55f0f1efc4408f1b794600ac529bcc3',
  MockYield: '0x90c5f5af3086655d10e3daa70c97e8f605a333c8',
  MockRWA: '0xc500240db43ef946eb0fed6c2f3c80a2d5195a8e',
  MockDOT: '0xa0fa71cba7361205b0e0db428ec0c51f8d9937cd',
  MockWBTC: '0xbed7cf7901215030751c4e5c3ac36e6acc33d51e',
};

const ERC20_ABI = [
  {
    inputs: [],
    name: 'faucet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

async function main() {
  console.log('🔍 Testing Moonbase Alpha Contracts\n');

  // Create public client
  const publicClient = createPublicClient({
    chain: {
      id: CHAIN_ID,
      name: 'Moonbase Alpha',
      nativeCurrency: { name: 'DEV', symbol: 'DEV', decimals: 18 },
      rpcUrls: {
        default: { http: [MOONBASE_RPC] },
        public: { http: [MOONBASE_RPC] },
      },
    },
    transport: http(MOONBASE_RPC),
  });

  try {
    // Test 1: Check if we can read contract
    console.log('✅ Testing MockUSDC contract...');
    const name = await publicClient.readContract({
      address: CONTRACTS.MockUSDC as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'name',
    });
    console.log(`   Token Name: ${name}`);

    // Test 2: Check if private key is set
    if (!process.env.PRIVATE_KEY) {
      console.log('\n⚠️  PRIVATE_KEY not set in .env');
      console.log('   Set your private key to test faucet transactions');
      console.log('   Example: PRIVATE_KEY=0x...\n');
      return;
    }

    // Create wallet client
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: {
        id: CHAIN_ID,
        name: 'Moonbase Alpha',
        nativeCurrency: { name: 'DEV', symbol: 'DEV', decimals: 18 },
        rpcUrls: {
          default: { http: [MOONBASE_RPC] },
          public: { http: [MOONBASE_RPC] },
        },
      },
      transport: http(MOONBASE_RPC),
    });

    console.log(`\n📍 Testing with address: ${account.address}`);

    // Check DEV balance
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`   DEV Balance: ${(Number(balance) / 1e18).toFixed(4)} DEV`);

    if (balance === 0n) {
      console.log('\n❌ No DEV tokens for gas!');
      console.log('   Get free DEV tokens from: https://faucet.moonbeam.network/');
      return;
    }

    // Test 3: Call faucet function
    console.log('\n🚰 Calling faucet() on MockUSDC...');
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MockUSDC as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'faucet',
    });

    console.log(`   Transaction: ${hash}`);
    console.log(`   Explorer: https://moonbase.moonscan.io/tx/${hash}`);

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   Status: ${receipt.status === 'success' ? '✅ Success' : '❌ Failed'}`);

    // Check new balance
    const newBalance = await publicClient.readContract({
      address: CONTRACTS.MockUSDC as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });
    console.log(`   New mUSDC Balance: ${(Number(newBalance) / 1e18).toFixed(2)}`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Solution: Get DEV tokens from https://faucet.moonbeam.network/');
    }
  }
}

main().catch(console.error);
