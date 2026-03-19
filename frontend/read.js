require('dotenv').config({ path: '../smart-contracts/.env' });
const { createPublicClient, http, createWalletClient } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { moonbaseAlpha } = require('viem/chains');

const FAUCET_ABI = [
  { inputs: [], name: 'faucetAmount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'amount', type: 'uint256' }], name: 'setFaucetAmount', outputs: [], stateMutability: 'nonpayable', type: 'function' }
];

async function main() {
  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http()
  });

  const address = "0xc825fe08d9bbad713bce175c8d4e6fdf20f9e4c0";

  try {
    const amount = await publicClient.readContract({
      address,
      abi: FAUCET_ABI,
      functionName: 'faucetAmount'
    });
    console.log("Current faucet amount:", amount.toString());

    // Fix it
    if (process.env.PRIVATE_KEY) {
      console.log("Setting new faucet amount to 100 * 1e8...");
      const account = privateKeyToAccount('0x' + process.env.PRIVATE_KEY);
      const walletClient = createWalletClient({
        account,
        chain: moonbaseAlpha,
        transport: http()
      });
      const hash = await walletClient.writeContract({
        address,
        abi: FAUCET_ABI,
        functionName: 'setFaucetAmount',
        args: [10000000000n] // 100 * 1e8
      });
      console.log("Tx hash:", hash);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
