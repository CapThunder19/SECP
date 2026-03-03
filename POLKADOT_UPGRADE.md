# SECP Protocol - Polkadot Hub Upgrade

## 🚀 Overview

The SECP decentralized lending protocol has been successfully upgraded from Arbitrum to **Polkadot Hub** with advanced cross-chain functionality, AI-powered risk prediction, and multi-chain collateral support.

## ✨ New Features

### 1. **Multi-Chain Support**
- **Primary Deployment**: Polkadot Asset Hub (Chain ID: 1000)
- **Testnet**: Westend Asset Hub (Chain ID: 420420421)
- **Legacy Support**: Arbitrum Sepolia (Chain ID: 421614)

### 2. **New Collateral Types**
- **DOT (Polkadot)**: Risk weight 85% - High quality L1 asset
- **WBTC (Wrapped Bitcoin)**: Risk weight 90% - Blue chip, highly liquid
- **Existing**: USDC (95%), RWA (80%), Yield tokens (75%)

### 3. **XCM Cross-Chain Bridge**
- Deposit and withdraw assets across Polkadot ecosystem chains
- Supported chains:
  - Polkadot Hub (parachain 1000)
  - Moonbeam (parachain 2004)
  - Acala (parachain 2000)
  - Astar (parachain 2006)
  - Arbitrum (bridged external chain)
- Real-time TVL tracking across all chains
- 5% safety discount on cross-chain collateral

### 4. **AI Risk Prediction System**
- On-chain AI model for real-time risk assessment
- Four risk levels: Low, Medium, High, Critical
- Weighted factors:
  - Market volatility (40%)
  - Liquidity conditions (25%)
  - Health factor (20%)
  - Portfolio diversification (15%)
- Auto-protection mode: Automatically triggers safety actions when high risk detected

### 5. **Cross-Chain Portfolio Rebalancer**
- Automatic portfolio optimization across multiple chains
- AI-driven rebalancing decisions
- Three operating modes:
  - **Flexible Mode**: Normal operations with real-time optimization
  - **Conservative Mode**: Risk reduction with chain diversification
  - **Freeze Mode**: Emergency protection with asset lock

### 6. **Enhanced Dashboard**
- Multi-chain collateral visualization
- Real-time AI risk alerts with actionable recommendations
- Cross-chain asset breakdown
- Market volatility and diversification metrics
- One-click bridge interface

## 📁 Project Structure

### Smart Contracts (New/Updated)

```
smart-contracts/
├── contracts/
│   ├── tokens/
│   │   ├── MockDOT.sol          ✨ NEW - Polkadot mock token
│   │   └── MockWBTC.sol         ✨ NEW - Wrapped Bitcoin mock
│   ├── bridge/
│   │   └── XCMBridge.sol        ✨ NEW - Cross-chain bridge
│   ├── ai/
│   │   └── AIRiskPredictor.sol  ✨ NEW - AI risk assessment
│   ├── rebalance/
│   │   └── CrossChainRebalancer.sol  ✨ NEW - Multi-chain rebalancer
│   └── vault/
│       └── CollateralManager.sol    🔄 UPDATED - AI & XCM integration
├── ignition/modules/
│   └── PolkadotHub.ts           ✨ NEW - Polkadot deployment module
└── scripts/
    └── setup-polkadot.ts        ✨ NEW - Setup script
```

### Frontend (New/Updated)

```
frontend/src/
├── config/
│   ├── wagmi.ts                 🔄 UPDATED - Multi-chain support
│   └── contracts.ts             🔄 UPDATED - Chain-aware addresses
├── hooks/
│   ├── useProtocolData.ts       🔄 UPDATED - Chain-aware hooks
│   └── useXCMProtocol.ts        ✨ NEW - XCM & AI hooks
└── components/
    └── dashboard/
        ├── Dashboard.tsx        🔄 UPDATED - New features integrated
        ├── MultiChainCollateral.tsx  ✨ NEW - Multi-chain view
        └── AIRiskAlerts.tsx     ✨ NEW - AI risk display
```

## 🛠️ Deployment Guide

### Prerequisites

```bash
# Install dependencies
cd smart-contracts
npm install

cd ../frontend
npm install
```

### Network Configuration

Configure your environment variables:

```bash
# smart-contracts/.env
PRIVATE_KEY=your_private_key_here
```

### Deploy to Polkadot Hub

```bash
cd smart-contracts

# Deploy all contracts to Westend Asset Hub (testnet)
npx hardhat ignition deploy ignition/modules/PolkadotHub.ts --network polkadotHubTestnet

# Setup contracts (configure risk weights, whitelist tokens, connect contracts)
npx hardhat run scripts/setup-polkadot.ts --network polkadotHubTestnet
```

### Deploy to Production (Polkadot Mainnet)

```bash
# Deploy to Polkadot Asset Hub mainnet
npx hardhat ignition deploy ignition/modules/PolkadotHub.ts --network polkadotHub

# Run setup
npx hardhat run scripts/setup-polkadot.ts --network polkadotHub
```

### Update Frontend Configuration

After deployment, update contract addresses in:
`frontend/src/config/contracts.ts`

```typescript
polkadotHub: {
  mockDOT: "0x...",
  mockWBTC: "0x...",
  xcmBridge: "0x...",
  aiRiskPredictor: "0x...",
  // ... other addresses
}
```

## 🎮 Usage Guide

### User Workflow

1. **Connect Wallet**
   - Support for MetaMask, WalletConnect, etc.
   - Automatically detects current chain

2. **Deposit Collateral**
   - Choose from DOT, WBTC, USDC, RWA, or Yield tokens
   - Collateral is automatically risk-weighted
   - View multi-chain positions in dashboard

3. **Bridge Assets**
   - Click "Bridge Assets" on any chain card
   - Select destination chain and amount
   - Confirm XCM transfer

4. **Borrow Stablecoins**
   - Maximum LTV: 75% of collateral value
   - Liquidation threshold: 85%
   - Safe threshold: 150% (1.5x health factor)

5. **Monitor AI Risk Alerts**
   - Real-time risk level display
   - Automatic recommendations
   - Enable auto-protection for automated safety

6. **Rebalance Portfolio**
   - Manual trigger or automatic based on AI predictions
   - Cross-chain optimization
   - Risk-adjusted asset allocation

### AI Risk Levels Explained

| Risk Level | Score Range | Action Required | Auto-Protection |
|------------|-------------|-----------------|-----------------|
| 🟢 **Low** | 0-30 | None - Safe to operate | None |
| 🟡 **Medium** | 31-60 | Monitor position | Watch mode |
| 🟠 **High** | 61-80 | Add collateral recommended | Rebalancing triggered |
| 🔴 **Critical** | 81-100 | Immediate action required | Emergency freeze |

## 🔐 Security Features

1. **Risk-Weighted Collateral**
   - Different assets have different safety factors
   - Prevents over-leveraging on risky assets

2. **Anti-Liquidation Protection**
   - Automatic debt repayment in emergency
   - Freeze mode to protect users

3. **Cross-Chain Safety Discount**
   - 5% haircut on cross-chain collateral
   - Accounts for bridge risk

4. **AI-Powered Monitoring**
   - Continuous market condition analysis
   - Proactive risk detection
   - Automated protective actions

## 📊 Smart Contract Functions

### XCM Bridge

```solidity
// Initiate cross-chain deposit
function initiateCrossChainDeposit(
    address user,
    address token,
    uint256 amount,
    Chain sourceChain
) external returns (bytes32 depositId);

// Withdraw to another chain
function withdrawToCrossChain(
    address token,
    uint256 amount,
    Chain destinationChain
) external;

// Get total TVL across all chains
function getTotalTVL() external view returns (uint256);
```

### AI Risk Predictor

```solidity
// Predict user-specific risk
function predictUserRisk(
    address user,
    uint256 healthFactor,
    uint256 diversification
) external returns (RiskLevel);

// Get current market risk
function getCurrentMarketRisk() external view returns (RiskLevel);

// Enable/disable auto-protection
function setAutoProtection(bool enabled) external;
```

### Cross-Chain Rebalancer

```solidity
// Trigger rebalancing for user
function rebalance(address user) external;

// Optimize portfolio across chains
function optimizePortfolioAcrossChains(address user) external;
```

## 🧪 Testing

```bash
cd smart-contracts

# Run all tests
npx hardhat test

# Test specific contract
npx hardhat test test/XCMBridge.test.ts
npx hardhat test test/AIRiskPredictor.test.ts
```

## 🌐 Frontend Development

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## 📈 Key Metrics

- **Supported Chains**: 5 (Polkadot Hub, Moonbeam, Acala, Astar, Arbitrum)
- **Collateral Types**: 5 (DOT, WBTC, USDC, RWA, Yield)
- **Maximum LTV**: 75%
- **Liquidation Threshold**: 85%
- **Safe Health Factor**: >150%
- **AI Model Weights**: Volatility (40%), Liquidity (25%), Health (20%), Diversification (15%)

## 🔄 Migration from Arbitrum

Existing Arbitrum users can:

1. Keep using Arbitrum Sepolia (legacy support maintained)
2. Bridge assets to Polkadot Hub for:
   - Lower transaction fees
   - Access to DOT and WBTC collateral
   - AI-powered risk management
   - Cross-chain portfolio optimization

## 🚦 Roadmap

- ✅ Polkadot Hub deployment
- ✅ XCM cross-chain bridge
- ✅ AI risk prediction
- ✅ Multi-chain dashboard
- 🔜 Additional parachain integrations (Kusama, Parallel)
- 🔜 Advanced AI models with external data feeds
- 🔜 Automated liquidation protection across chains
- 🔜 Governance token for protocol parameters

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

## 📞 Support

- **Documentation**: See README.md files in each directory
- **Issues**: Submit via GitHub Issues
- **Discord**: [Community Link]
- **Twitter**: [@SECPProtocol]

## ⚖️ License

MIT License - See LICENSE file for details

---

**Built with ❤️ for the Polkadot ecosystem**

*Secure, Scalable, Interoperable Lending Protocol*
