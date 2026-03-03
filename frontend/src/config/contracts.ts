// Contract addresses for different networks
export const CONTRACTS = {
  // Arbitrum Sepolia (original deployment)
  arbitrumSepolia: {
    mockUSDC: "0x4cb63f6ba14e54f3422e3b66955ef5ee690ae2c8",
    mockYield: "0x89fa6ae8ae17cdff1b917a31fba44f7bddcd3c62",
    mockRWA: "0x3fac055201501b26a8083761655bd1909840c454",
    mockDOT: "0x0000000000000000000000000000000000000000", // Not deployed
    mockWBTC: "0x0000000000000000000000000000000000000000", // Not deployed
    mockOracle: "0x539e55d266f1ff01716432755ec31f6674e928c1",
    smartVault: "0x2e8026bc45fe0fae2b159a3c82cada12670769e2",
    loanManager: "0xba5be20d3d96e89ffbf20f9812df73cada28e376",
    collateralManager: "0xfa7e1a8e4be412b9c7efcbb5f14ddcc5820da599",
    antiLiquidation: "0x55c65fa19b212026125b59d8db6100079ed86ac6",
    crossChainRebalancer: "0x0161bc2788638e2b2d27fc037dfca0fab7dee46f",
    yieldManager: "0x435f820c2359e487cd963c3556d88d0196a7ae26",
    xcmBridge: "0x0000000000000000000000000000000000000000", // Not deployed
    aiRiskPredictor: "0x0000000000000000000000000000000000000000", // Not deployed
  },
  // Polkadot Hub (new deployment - placeholder addresses)
  polkadotHub: {
    mockUSDC: "0x0000000000000000000000000000000000000000",
    mockYield: "0x0000000000000000000000000000000000000000",
    mockRWA: "0x0000000000000000000000000000000000000000",
    mockDOT: "0x0000000000000000000000000000000000000000",
    mockWBTC: "0x0000000000000000000000000000000000000000",
    mockOracle: "0x0000000000000000000000000000000000000000",
    smartVault: "0x0000000000000000000000000000000000000000",
    loanManager: "0x0000000000000000000000000000000000000000",
    collateralManager: "0x0000000000000000000000000000000000000000",
    antiLiquidation: "0x0000000000000000000000000000000000000000",
    crossChainRebalancer: "0x0000000000000000000000000000000000000000",
    yieldManager: "0x0000000000000000000000000000000000000000",
    xcmBridge: "0x0000000000000000000000000000000000000000",
    aiRiskPredictor: "0x0000000000000000000000000000000000000000",
  },
  // Moonbase Alpha (Moonbeam testnet - DEPLOYED ✅)
  moonbaseAlpha: {
    mockUSDC: "0x2910009bb55f0f1efc4408f1b794600ac529bcc3",
    mockYield: "0x90c5f5af3086655d10e3daa70c97e8f605a333c8",
    mockRWA: "0xc500240db43ef946eb0fed6c2f3c80a2d5195a8e",
    mockDOT: "0xa0fa71cba7361205b0e0db428ec0c51f8d9937cd",
    mockWBTC: "0xbed7cf7901215030751c4e5c3ac36e6acc33d51e",
    mockOracle: "0x2431412258006a6f49b4f3361767427c3cbc3532",
    smartVault: "0x9ac3a6ba0a9459994aa6c568ae19920138487fca",
    loanManager: "0xcb29fec76ff9a4e7432b5f725b16aad190a0cc26",
    collateralManager: "0xfd46da485e35732d802325d31534ba34d0335033",
    antiLiquidation: "0xb0b8e5ef9eef4861998a2a4a0d73bc7ea86bee28",
    crossChainRebalancer: "0xfbf16e331ae416b7406e9a98017e8542bbf88582",
    yieldManager: "0xd9a390325db7f17db81cb1d69ed7fde6366c2690",
    xcmBridge: "0x6a70042cbe0164b876a6df864b5f01e4142fe3f5",
    aiRiskPredictor: "0x7a3e5b12b80aa89026493d22187fb6923da85c46",
  },
} as const;

// Chain IDs
export const CHAIN_IDS = {
  arbitrumSepolia: 421614,
  polkadotHub: 1000,
  moonbaseAlpha: 1287,
} as const;

// Get contracts for current chain
export function getContractsForChain(chainId: number) {
  switch (chainId) {
    case CHAIN_IDS.arbitrumSepolia:
      return CONTRACTS.arbitrumSepolia;
    case CHAIN_IDS.polkadotHub:
      return CONTRACTS.polkadotHub;
    case CHAIN_IDS.moonbaseAlpha:
      return CONTRACTS.moonbaseAlpha;
    default:
      return CONTRACTS.moonbaseAlpha; // Default to testnet
  }
}

// Supported collateral tokens by chain
export const COLLATERAL_TOKENS = {
  arbitrumSepolia: [
    { symbol: "mUSDC", name: "Mock USDC", weight: 95 },
    { symbol: "mRWA", name: "Mock RWA", weight: 80 },
    { symbol: "mYield", name: "Mock Yield", weight: 75 },
  ],
  polkadotHub: [
    { symbol: "mDOT", name: "Mock DOT", weight: 85 },
    { symbol: "mWBTC", name: "Mock WBTC", weight: 90 },
    { symbol: "mUSDC", name: "Mock USDC", weight: 95 },
    { symbol: "mRWA", name: "Mock RWA", weight: 80 },
    { symbol: "mYield", name: "Mock Yield", weight: 75 },
  ],
  moonbaseAlpha: [
    { symbol: "mDOT", name: "Mock DOT", weight: 85 },
    { symbol: "mWBTC", name: "Mock WBTC", weight: 90 },
    { symbol: "mUSDC", name: "Mock USDC", weight: 95 },
    { symbol: "mRWA", name: "Mock RWA", weight: 80 },
    { symbol: "mYield", name: "Mock Yield", weight: 75 },
  ],
} as const;

// XCM supported chains
export enum XCMChain {
  PolkadotHub = 0,
  Moonbeam = 1,
  Acala = 2,
  Astar = 3,
  Arbitrum = 4,
}

export const XCM_CHAIN_NAMES = {
  [XCMChain.PolkadotHub]: "Polkadot Hub",
  [XCMChain.Moonbeam]: "Moonbeam",
  [XCMChain.Acala]: "Acala",
  [XCMChain.Astar]: "Astar",
  [XCMChain.Arbitrum]: "Arbitrum",
} as const;
