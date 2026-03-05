import hre from "hardhat";
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';

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
 * Setup token mappings between Sepolia and Moonbase
 * Maps: Sepolia DOT -> Moonbase DOT, etc.
 */
async function main() {
  console.log("🔗 Setting up cross-chain token mappings...\n");

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

  // Load deployments
  const moonbaseDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "undefined-1772698697619.json"), "utf-8")
  );
  
  const sepoliaDeployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "deployments", "sepolia-bridge.json"), "utf-8")
  );

  const bridgeAddress = moonbaseDeployment.contracts.XCMBridge as `0x${string}`;
  
  console.log("Bridge Address:", bridgeAddress);
  console.log("Setting up mappings on Moonbase Alpha...\n");

  // Get bridge ABI
  const bridgeArtifact = await hre.artifacts.readArtifact("XCMBridge");

  // Chain enum
  const CHAIN = {
    PolkadotHub: 0,
    Moonbeam: 1,
    Acala: 2,
    Astar: 3,
    Arbitrum: 4,
    Sepolia: 5
  };

  // Token mappings: Sepolia token -> Moonbase token
  const mappings = [
    {
      name: "DOT",
      sourceChain: CHAIN.Sepolia,
      sourceToken: sepoliaDeployment.contracts.mockDOT,
      destToken: moonbaseDeployment.contracts.MockDOT
    },
    {
      name: "WBTC",
      sourceChain: CHAIN.Sepolia,
      sourceToken: sepoliaDeployment.contracts.mockWBTC,
      destToken: moonbaseDeployment.contracts.MockWBTC
    },
    {
      name: "USDC",
      sourceChain: CHAIN.Sepolia,
      sourceToken: sepoliaDeployment.contracts.mockUSDC,
      destToken: moonbaseDeployment.contracts.MockUSDC
    }
  ];

  console.log("📋 Token Mappings:");
  for (const mapping of mappings) {
    console.log(`   ${mapping.name}:`);
    console.log(`     Sepolia: ${mapping.sourceToken}`);
    console.log(`     Moonbase: ${mapping.destToken}`);
    console.log();
  }

  // Set mappings
  for (const mapping of mappings) {
    console.log(`Setting mapping for ${mapping.name}...`);
    
    try {
      const hash = await walletClient.writeContract({
        address: bridgeAddress,
        abi: bridgeArtifact.abi,
        functionName: 'setTokenMapping',
        args: [mapping.sourceChain, mapping.sourceToken as `0x${string}`, mapping.destToken as `0x${string}`]
      });

      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`   ✅ ${mapping.name} mapping set`);
      console.log();
    } catch (error: any) {
      console.error(`   ❌ Failed to set ${mapping.name} mapping:`, error.message);
      console.log();
    }
  }

  console.log("✅ Token mapping setup complete!\n");
  console.log("You can now bridge tokens between Sepolia and Moonbase Alpha.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
