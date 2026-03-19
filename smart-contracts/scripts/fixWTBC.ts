import { ethers } from "hardhat";

async function main() {
  const mWBTCAddress = "0xc825fe08d9bbad713bce175c8d4e6fdf20f9e4c0";
  // We assume the deployer's private key is in .env or the user's hardhat config
  // Let's attach to the MockWBTC contract at that address
  const MockWBTC = await ethers.getContractAt("MockWBTC", mWBTCAddress);

  console.log("Setting faucet amount for WBTC to 100 * 1e8...");
  const tx = await MockWBTC.setFaucetAmount(ethers.parseUnits("100", 8));
  await tx.wait();
  
  console.log("Faucet amount set successfully!");
}

main().catch(console.error);
