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
  // Moonbase Alpha (Moonbeam testnet - DEPLOYED ✅ - Updated with XCM support)
  moonbaseAlpha: {
    mockUSDC: "0x6487ed309006ce5c94d03f428476b30f9b8b787c",
    mockYield: "0x7f049d2dec7b1e1d3b6c50998ad7e69e1ecc8220",
    mockRWA: "0x6398277dd089c4c470e8fca6f2cd6224a18186e1",
    mockDOT: "0x3b1d6b1c0a067dd74f60a480ec5b6b6bb7cad470",
    mockWBTC: "0xfde4bc6c775fb0387b1e9b30d9d872bf01d001c5",
    mockOracle: "0x8236e5c95821cec3cb1d39da443c399e829f8d5b",
    smartVault: "0x25c7c2d7cae8bf5ca240345e9183f6c9fe5cd2ce",
    loanManager: "0xb1e33643ade11a0010f5a0e74b4d827c961b56cd",
    collateralManager: "0xae216ee7f1fe422abf8230b4805fe559e97c035d",
    antiLiquidation: "0x9fbd88f6cd91c743573c66f0c151f81e7e188140",
    crossChainRebalancer: "0xe2282687b56365288d9fe130b56bb5476adf3b83",
    yieldManager: "0x0b0ca967eae0a762c4a25394d5238a19572bdeb0",
    xcmBridge: "0x33e5956ba6c2a460b5b13e7a55e7029298e05752",
    aiRiskPredictor: "0xfabe093701f79da3e383fc96f27ad2057a9e62f1",
  },
  // Sepolia (Ethereum testnet - Bridge deployment)
  sepolia: {
    mockUSDC: "0xff33201c7ee4e533052687a02307fa692f0c8833",
    mockYield: "0x0000000000000000000000000000000000000000", // Not deployed
    mockRWA: "0x0000000000000000000000000000000000000000", // Not deployed
    mockDOT: "0x79051e5b5a0936718014acd1c53821de5055b39f",
    mockWBTC: "0x7599834019981d6aee00e2164f3587244c682199",
    mockOracle: "0x0000000000000000000000000000000000000000", // Not deployed
    smartVault: "0x0000000000000000000000000000000000000000", // Not deployed
    loanManager: "0x0000000000000000000000000000000000000000", // Not deployed
    collateralManager: "0x0000000000000000000000000000000000000000", // Not deployed
    antiLiquidation: "0x0000000000000000000000000000000000000000", // Not deployed
    crossChainRebalancer: "0x0000000000000000000000000000000000000000", // Not deployed
    yieldManager: "0x0000000000000000000000000000000000000000", // Not deployed
    xcmBridge: "0xd7a7b423350513b1651743575a94f99b227dcaef",
    aiRiskPredictor: "0x0000000000000000000000000000000000000000", // Not deployed
  },
} as const;

// Chain IDs
export const CHAIN_IDS = {
  arbitrumSepolia: 421614,
  polkadotHub: 1000,
  moonbaseAlpha: 1287,
  sepolia: 11155111,
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
    case CHAIN_IDS.sepolia:
      return CONTRACTS.sepolia;
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
  sepolia: [
    { symbol: "mDOT", name: "Mock DOT", weight: 85 },
    { symbol: "mWBTC", name: "Mock WBTC", weight: 90 },
    { symbol: "mUSDC", name: "Mock USDC", weight: 95 },
  ],
} as const;

// XCM supported chains
export enum XCMChain {
  PolkadotHub = 0,
  Moonbeam = 1,
  Acala = 2,
  Astar = 3,
  Arbitrum = 4,
  Sepolia = 5,
}

export const XCM_CHAIN_NAMES = {
  [XCMChain.PolkadotHub]: "Polkadot Hub",
  [XCMChain.Moonbeam]: "Moonbeam",
  [XCMChain.Acala]: "Acala",
  [XCMChain.Astar]: "Astar",
  [XCMChain.Arbitrum]: "Arbitrum",
  [XCMChain.Sepolia]: "Sepolia",
} as const;
