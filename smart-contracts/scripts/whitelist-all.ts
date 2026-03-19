import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { moonbaseAlpha } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

const XCM_BRIDGE_ABI = [{
    inputs: [{ name: "token", type: "address" }, { name: "status", type: "bool" }],
    name: "whitelistToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
},
{
    inputs: [{ name: "token", type: "address" }],
    name: "whitelistedTokens",
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "view",
    type: "function"
}];

const xcmBridgeAddress = "0x33e5956ba6c2a460b5b13e7a55e7029298e05752"; // NEW XCM BRIDGE

const tokens = {
    mockDOT: "0x3b1d6b1c0a067dd74f60a480ec5b6b6bb7cad470",
    mockWBTC: "0xfde4bc6c775fb0387b1e9b30d9d872bf01d001c5",
    mockYield: "0x7f049d2dec7b1e1d3b6c50998ad7e69e1ecc8220",
    mockRWA: "0x6398277dd089c4c470e8fca6f2cd6224a18186e1"
};

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("No private key");
    
    const account = privateKeyToAccount(`0x${privateKey}`);
    const publicClient = createPublicClient({ chain: moonbaseAlpha, transport: http() });
    const walletClient = createWalletClient({ account, chain: moonbaseAlpha, transport: http() });

    console.log("Checking XCM Bridge Token Whitelists on NEW BRIDGE...");

    for (const [name, address] of Object.entries(tokens)) {
        console.log(`Checking ${name}...`);
        const isWhitelisted = await publicClient.readContract({
            address: xcmBridgeAddress as `0x${string}`,
            abi: XCM_BRIDGE_ABI,
            functionName: "whitelistedTokens",
            args: [address as `0x${string}`]
        });

        if (!isWhitelisted) {
            console.log(`  -> Whitelisting ${name} (${address})...`);
            const tx = await walletClient.writeContract({
                address: xcmBridgeAddress as `0x${string}`,
                abi: XCM_BRIDGE_ABI,
                functionName: "whitelistToken",
                args: [address as `0x${string}`, true]
            });
            await publicClient.waitForTransactionReceipt({ hash: tx });
            console.log(`  -> Success!`);
        } else {
            console.log(`  -> Already whitelisted!`);
        }
    }
    console.log("All tokens whitelisted securely on the new bridge!");
}

main().catch(console.error);
