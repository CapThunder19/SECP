import { config } from 'dotenv';
config();
import { createPublicClient, http, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { moonbaseAlpha } from 'viem/chains';

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
      address: address as `0x${string}`,
      abi: FAUCET_ABI,
      functionName: 'faucetAmount'
    });
    console.log("Current faucet amount:", amount.toString());

    if (process.env.PRIVATE_KEY) {
      console.log("Setting new faucet amount to 100 * 1e8...", process.env.PRIVATE_KEY.slice(0, 4) + '...');
      const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
      const walletClient = createWalletClient({
        account,
        chain: moonbaseAlpha,
        transport: http()
      });
      const hash = await walletClient.writeContract({
        address: address as `0x${string}`,
        abi: FAUCET_ABI,
        functionName: 'setFaucetAmount',
        args: [10000000000n] // 100 * 1e8
      });
      console.log("Tx hash:", hash);
    } else {
        console.log("No PRIVATE_KEY found");
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main();
