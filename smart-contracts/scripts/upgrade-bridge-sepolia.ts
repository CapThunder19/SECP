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

const sepolia = defineChain({
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { 
      http: [
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://rpc2.sepolia.org',
        'https://sepolia.gateway.tenderly.co'
      ] 
    }
  },
});

/**
 * Upgrade XCMBridge on Sepolia with real cross-chain functionality
 */
async function main() {
  console.log("🚀 Upgrading XCMBridge on Sepolia...\n");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Please set PRIVATE_KEY in .env file");
  }

  const account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(undefined, {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(undefined, {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  });

  console.log("Deploying with account:", account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Account balance:", (Number(balance) / 1e18).toFixed(4), "ETH\n");

  // Load existing deployment
  const existingDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "sepolia-bridge.json"), "utf-8")
  );

  console.log("Existing tokens on Sepolia:");
  console.log("  DOT:", existingDeployment.contracts.mockDOT);
  console.log("  WBTC:", existingDeployment.contracts.mockWBTC);
  console.log("  USDC:", existingDeployment.contracts.mockUSDC);
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

  // Whitelist tokens
  console.log("=== Whitelisting Tokens ===\n");
  
  const tokens = [
    { name: "DOT", address: existingDeployment.contracts.mockDOT },
    { name: "WBTC", address: existingDeployment.contracts.mockWBTC },
    { name: "USDC", address: existingDeployment.contracts.mockUSDC },
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

  // Setup token mappings (Moonbase → Sepolia)
  console.log("=== Setting Up Token Mappings (Moonbase → Sepolia) ===\n");

  const moonbaseDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "undefined-1772698697619.json"), "utf-8")
  );

  const CHAIN_MOONBEAM = 1;

  const mappings = [
    {
      name: "DOT",
      sourceToken: moonbaseDeployment.contracts.MockDOT,
      destToken: existingDeployment.contracts.mockDOT
    },
    {
      name: "WBTC",
      sourceToken: moonbaseDeployment.contracts.MockWBTC,
      destToken: existingDeployment.contracts.mockWBTC
    },
    {
      name: "USDC",
      sourceToken: moonbaseDeployment.contracts.MockUSDC,
      destToken: existingDeployment.contracts.mockUSDC
    }
  ];

  for (const mapping of mappings) {
    console.log(`Setting ${mapping.name} mapping:`);
    console.log(`   Moonbase: ${mapping.sourceToken}`);
    console.log(`   Sepolia:  ${mapping.destToken}`);
    
    const hash = await walletClient.writeContract({
      address: newBridgeAddress,
      abi: bridgeArtifact.abi,
      functionName: 'setTokenMapping',
      args: [CHAIN_MOONBEAM, mapping.sourceToken as `0x${string}`, mapping.destToken as `0x${string}`],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   ✅ ${mapping.name} mapping set\n`);
  }

  // Save updated deployment
  const updatedDeployment = {
    ...existingDeployment,
    contracts: {
      ...existingDeployment.contracts,
      xcmBridge: newBridgeAddress,
      xcmBridgeOld: existingDeployment.contracts.xcmBridge, // Keep old for reference
    },
    timestamp: new Date().toISOString(),
    upgraded: true,
  };

  fs.writeFileSync(
    path.join(__dirname, "..", "deployments", "sepolia-bridge.json"),
    JSON.stringify(updatedDeployment, null, 2)
  );
  
  console.log("=== Deployment Complete ===\n");
  console.log("New XCMBridge:", newBridgeAddress);
  console.log("Old XCMBridge:", existingDeployment.contracts.xcmBridge);
  console.log();
  console.log("📝 Saved to: deployments/sepolia-bridge.json");
  console.log();
  console.log("✅ Upgrade complete!");
  console.log();
  console.log("Both chains are now upgraded!");
  console.log("Start the relayer: npm run bridge:relayer-v2");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
