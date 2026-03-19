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
    mockUSDC: "0x76f94baa45893e1ce846f926d761431caa6e2378",
    mockYield: "0x308dccae804cb81d74bc02ff1ddaf7c6bcfb3fe0",
    mockRWA: "0xdbd06fa5936b2d6ccce8fb269d59b400ff73e6ec",
    mockDOT: "0x375318d88b0fcaf58538cf8e3812640f38a1ff98",
    mockWBTC: "0xd500de8fa3285816fa1684c141d5f822ea6f6cd8", // Redeployed 18 decimal WTBC to prevent faucet error
    mockOracle: "0x33f27f3ec5f0e48bdf3aa8d35204e94e742fc585",
    smartVault: "0xddcfe550d0e1fa5cc4ed34dad01741058b98411d",
    loanManager: "0x88482b88501cd20ff3610ff4318d2c00bac0c382",
    collateralManager: "0x49a369a90e490506b89ad2bf4546fb68521036cc",
    antiLiquidation: "0x20a7fdd6d0955da5bbfba4f099f298b579b24f75",
    crossChainRebalancer: "0x7829a0f917f5eb9cc1be58a6e234276045b6c9bd",
    yieldManager: "0xf5d5d4b8b736f2a1dbb35b1c017abe243d44c117",
    xcmBridge: "0xe9a634a478eaddc288721736426abd5db0395825",
    aiRiskPredictor: "0xc5ba634b391e58d82107b73801f861226ce25633",
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
