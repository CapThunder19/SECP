import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { moonbaseAlpha } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

// Contract ABI fragments we need
const SMART_VAULT_ABI = [{
    inputs: [{ name: "token", type: "address" }],
    name: "addSupportedToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
}];

const ORACLE_ABI = [{
    inputs: [{ name: "token", type: "address" }, { name: "price", type: "uint256" }],
    name: "setPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
}];

const COLLATERAL_MANAGER_ABI = [{
    inputs: [{ name: "token", type: "address" }, { name: "weight", type: "uint256" }],
    name: "setAssetWeight",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
}];

async function main() {
    console.log("Starting WBTC Protocol Patch...");
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("No private key");
    
    const account = privateKeyToAccount(`0x${privateKey}`);
    const publicClient = createPublicClient({ chain: moonbaseAlpha, transport: http() });
    const walletClient = createWalletClient({ account, chain: moonbaseAlpha, transport: http() });

    // New WBTC Address deployed earlier
    const newWBTC = "0xd500de8fa3285816fa1684c141d5f822ea6f6cd8";
    
    const smartVault = "0xddcfe550d0e1fa5cc4ed34dad01741058b98411d";
    const oracle = "0x33f27f3ec5f0e48bdf3aa8d35204e94e742fc585";
    const collateralManager = "0x49a369a90e490506b89ad2bf4546fb68521036cc";

    try {
        console.log("1. Adding MockWBTC to SmartVault supported tokens...");
        const tx1 = await walletClient.writeContract({
            address: smartVault as `0x${string}`,
            abi: SMART_VAULT_ABI,
            functionName: "addSupportedToken",
            args: [newWBTC as `0x${string}`]
        });
        await publicClient.waitForTransactionReceipt({ hash: tx1 });
        console.log("-> Success!");

        console.log("2. Setting MockWBTC Oracle Price to $60,000...");
        const tx2 = await walletClient.writeContract({
            address: oracle as `0x${string}`,
            abi: ORACLE_ABI,
            functionName: "setPrice",
            args: [newWBTC as `0x${string}`, 60000000000000000000000n] // 60,000 * 10^18
        });
        await publicClient.waitForTransactionReceipt({ hash: tx2 });
        console.log("-> Success!");

        console.log("3. Setting MockWBTC Asset Risk Weight to 90% in CollateralManager...");
        const tx3 = await walletClient.writeContract({
            address: collateralManager as `0x${string}`,
            abi: COLLATERAL_MANAGER_ABI,
            functionName: "setAssetWeight",
            args: [newWBTC as `0x${string}`, 90n]
        });
        await publicClient.waitForTransactionReceipt({ hash: tx3 });
        console.log("-> Success! MockWBTC fully integrated.");
    } catch(err) {
        console.error("Patch failed:", err);
    }
}
main().catch(console.error);
