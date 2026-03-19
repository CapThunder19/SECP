import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { moonbaseAlpha } from "viem/chains";
import * as dotenv from "dotenv";
import * as fs from "fs";
import hre from "hardhat";

dotenv.config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const account = privateKeyToAccount(`0x${privateKey}`);
  
  const publicClient = createPublicClient({ chain: moonbaseAlpha, transport: http() });
  const walletClient = createWalletClient({ account, chain: moonbaseAlpha, transport: http() });

  const artifact = await hre.artifacts.readArtifact("MockWBTC");

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const newAddress = receipt.contractAddress;
  
  fs.writeFileSync("wbtc-address.txt", newAddress);
  console.log("Deployed to:", newAddress);

  const setAmountHash = await walletClient.writeContract({
    address: newAddress,
    abi: artifact.abi,
    functionName: "setFaucetAmount",
    args: [10000000000n] // 100 * 1e8
  });
  await publicClient.waitForTransactionReceipt({ hash: setAmountHash });
}
main().catch(console.error);
