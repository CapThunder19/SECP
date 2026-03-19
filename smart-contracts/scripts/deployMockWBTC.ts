import { ethers } from "hardhat";

async function main() {
  console.log("Deploying a fresh MockWBTC...");
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const WBTC = await ethers.getContractFactory("MockWBTC");
  const wbtc = await WBTC.deploy();
  await wbtc.waitForDeployment();
  const address = await wbtc.getAddress();
  
  console.log("MockWBTC deployed to:", address);

  // set proper faucet amount for 8 decimals
  console.log("Fixing faucet amount for 8 decimals (100 mWBTC)...");
  const tx = await wbtc.setFaucetAmount(ethers.parseUnits("100", 8));
  await tx.wait();
  
  console.log("All done!");
}

main().catch(console.error);
