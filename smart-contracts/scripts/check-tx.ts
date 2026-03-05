import { createPublicClient, http, defineChain } from "viem";

const moonbaseAlpha = defineChain({
  id: 1287,
  name: 'Moonbase Alpha',
  nativeCurrency: { name: 'DEV', symbol: 'DEV', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.api.moonbase.moonbeam.network'] }
  },
});

async function main() {
  // The deposit transaction hash from the screenshot
  const txHash = "0xb54eb8fa4df4f7275f507912cfca5eb554d17e8624283322d9acd92d34ab88ca" as `0x${string}`;
  
  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(),
  });
  
  console.log("🔍 Checking transaction:", txHash);
  console.log();
  
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
  
  console.log("Transaction Receipt:");
  console.log("Status:", receipt.status);
  console.log("Block:", receipt.blockNumber);
  console.log("Gas used:", receipt.gasUsed);
  console.log("From:", receipt.from);
  console.log("To:", receipt.to);
  console.log();
  
  if (receipt.status === 'reverted') {
    console.log("❌ Transaction REVERTED");
    console.log();
    
    // Try to get the transaction details to see the revert reason
    const tx = await publicClient.getTransaction({ hash: txHash });
    console.log("Transaction details:");
    console.log("Input data:", tx.input.slice(0, 200) + "...");
    
    // Try to trace the transaction to get revert reason
    try {
      const trace = await publicClient.request({
        method: 'trace_replayTransaction' as any,
        params: [txHash, ['trace']],
      });
      console.log("Trace:", JSON.stringify(trace, null, 2));
    } catch (e) {
      console.log("Could not get trace (not supported on this RPC)");
    }
  } else {
    console.log("✅ Transaction SUCCESS");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
