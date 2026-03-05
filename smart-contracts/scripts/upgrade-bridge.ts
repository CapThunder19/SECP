import hre from "hardhat";
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const moonbaseAlpha = defineChain({
  id: 1287,
  name: 'Moonbase Alpha',
  nativeCurrency: { name: 'DEV', symbol: 'DEV', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.api.moonbase.moonbeam.network'] }
  },
});

/**
 * Upgrade XCMBridge on Moonbase Alpha with real cross-chain functionality
 */
async function main() {
  console.log("🚀 Upgrading XCMBridge on Moonbase Alpha...\n");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Please set PRIVATE_KEY in .env file");
  }

  const account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);
  
  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(undefined, {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  });

  const walletClient = createWalletClient({
    account,
    chain: moonbaseAlpha,
    transport: http(undefined, {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  });

  console.log("Deploying with account:", account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Account balance:", (Number(balance) / 1e18).toFixed(4), "DEV\n");

  // Load existing deployment
  const existingDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "undefined-1772698697619.json"), "utf-8")
  );

  const smartVault = existingDeployment.contracts.SmartVault;
  console.log("SmartVault:", smartVault);
  console.log();

  // Deploy new XCMBridge
  console.log("=== Deploying Upgraded XCMBridge ===\n");
  const bridgeArtifact = await hre.artifacts.readArtifact("XCMBridge");
  
  const deployHash = await walletClient.deployContract({
    abi: bridgeArtifact.abi,
    bytecode: bridgeArtifact.bytecode as `0x${string}`,
    args: [],
  });

  console.log("   ⏳ Transaction:", deployHash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
  
  if (!receipt.contractAddress) {
    throw new Error("Failed to deploy XCMBridge");
  }

  const newBridgeAddress = receipt.contractAddress;
  console.log("   ✅ XCMBridge deployed at:", newBridgeAddress);
  console.log();

  // Configure bridge
  console.log("=== Configuring Bridge ===\n");

  // Set SmartVault
  console.log("Setting SmartVault...");
  const setVaultHash = await walletClient.writeContract({
    address: newBridgeAddress,
    abi: bridgeArtifact.abi,
    functionName: 'setSmartVault',
    args: [smartVault as `0x${string}`],
  });
  await publicClient.waitForTransactionReceipt({ hash: setVaultHash });
  console.log("   ✅ SmartVault set\n");

  // Whitelist tokens
  const tokens = [
    { name: "DOT", address: existingDeployment.contracts.MockDOT },
    { name: "WBTC", address: existingDeployment.contracts.MockWBTC },
    { name: "USDC", address: existingDeployment.contracts.MockUSDC },
    { name: "RWA", address: existingDeployment.contracts.MockRWA },
    { name: "Yield", address: existingDeployment.contracts.MockYield },
  ];

  for (const token of tokens) {
    console.log(`Whitelisting ${token.name}...`);
    const hash = await walletClient.writeContract({
      address: newBridgeAddress,
      abi: bridgeArtifact.abi,
      functionName: 'whitelistToken',
      args: [token.address as `0x${string}`, true],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   ✅ ${token.name} whitelisted`);
  }

  console.log();

  // Setup token mappings
  console.log("=== Setting Up Token Mappings (Sepolia → Moonbase) ===\n");

  const sepoliaDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "sepolia-bridge.json"), "utf-8")
  );

  const CHAIN_SEPOLIA = 5;

  const mappings = [
    {
      name: "DOT",
      sourceToken: sepoliaDeployment.contracts.mockDOT,
      destToken: existingDeployment.contracts.MockDOT
    },
    {
      name: "WBTC",
      sourceToken: sepoliaDeployment.contracts.mockWBTC,
      destToken: existingDeployment.contracts.MockWBTC
    },
    {
      name: "USDC",
      sourceToken: sepoliaDeployment.contracts.mockUSDC,
      destToken: existingDeployment.contracts.MockUSDC
    }
  ];

  for (const mapping of mappings) {
    console.log(`Setting ${mapping.name} mapping:`);
    console.log(`   Sepolia:  ${mapping.sourceToken}`);
    console.log(`   Moonbase: ${mapping.destToken}`);
    
    const hash = await walletClient.writeContract({
      address: newBridgeAddress,
      abi: bridgeArtifact.abi,
      functionName: 'setTokenMapping',
      args: [CHAIN_SEPOLIA, mapping.sourceToken as `0x${string}`, mapping.destToken as `0x${string}`],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   ✅ ${mapping.name} mapping set\n`);
  }

  // Save updated deployment
  const updatedDeployment = {
    ...existingDeployment,
    contracts: {
      ...existingDeployment.contracts,
      XCMBridge: newBridgeAddress,
      XCMBridgeOld: existingDeployment.contracts.XCMBridge, // Keep old for reference
    },
    timestamp: new Date().toISOString(),
    upgraded: true,
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", "moonbase-upgraded.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(updatedDeployment, null, 2));
  
  console.log("=== Deployment Complete ===\n");
  console.log("New XCMBridge:", newBridgeAddress);
  console.log("Old XCMBridge:", existingDeployment.contracts.XCMBridge);
  console.log();
  console.log("📝 Saved to:", deploymentPath);
  console.log();
  console.log("✅ Upgrade complete!");
  console.log();
  console.log("Next steps:");
  console.log("1. Upgrade Sepolia bridge: npm run bridge:upgrade-sepolia");
  console.log("2. Update frontend config with new bridge address");
  console.log("3. Start new relayer: npm run bridge:relayer-v2");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
