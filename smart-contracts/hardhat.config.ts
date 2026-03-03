import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ignition-viem";
import { configVariable, defineConfig } from "hardhat/config";

// Helper to get optional config variable with default
const getPrivateKey = () => {
  try {
    return configVariable("PRIVATE_KEY");
  } catch {
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  }
};

export default defineConfig({
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    arbitrumSepolia: {
      type: "http",
      chainType: "op", // Arbitrum is an L2
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: [getPrivateKey()],
      chainId: 421614,
    },
    polkadotHub: {
      type: "http",
      chainType: "l1",
      url: process.env.POLKADOT_HUB_RPC_URL || "https://polkadot-asset-hub-rpc.polkadot.io",
      accounts: [getPrivateKey()],
      chainId: 1000, // Polkadot Hub MAINNET - Use for final hackathon submission
    },
    polkadotHubTestnet: {
      type: "http",
      chainType: "l1",
      url: process.env.POLKADOT_HUB_TESTNET_RPC_URL || "https://rpc.api.moonbase.moonbeam.network",
      accounts: [getPrivateKey()],
      chainId: 1287, // Moonbase Alpha TESTNET - Use for development/testing
    },
  },
});
