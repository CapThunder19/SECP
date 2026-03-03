# 🏆 Polkadot Solidity Hackathon - Deployment Guide

## Hackathon Details
- **Period**: Feb 15 - Mar 24, 2026
- **Submission Deadline**: March 20, 2026
- **Track**: EVM Smart Contract Track (DeFi & AI-powered dapps)
- **Prize Pool**: $15,000

## 🎯 Two-Phase Deployment Strategy

### Phase 1: Development & Testing (NOW)
Use **Moonbase Alpha Testnet** for rapid iteration and testing.

**Network Details:**
- **Name**: Moonbase Alpha
- **RPC**: `https://rpc.api.moonbase.moonbeam.network`
- **Chain ID**: `1287`
- **Currency**: DEV
- **Explorer**: https://moonbase.moonscan.io
- **Faucet**: https://faucet.moonbeam.network/

**Get FREE Testnet Tokens:**
1. Visit https://faucet.moonbeam.network/
2. Connect wallet: `0x50a43891937acAA0596163270576aABE4FfeF6Cc`
3. Request DEV tokens (instant!)

**Deploy to Testnet:**
```bash
cd smart-contracts
npm run compile
npm run deploy:polkadot      # Deploys to Moonbase Alpha
npm run setup:polkadot       # Configures contracts
```

### Phase 2: Final Submission (Before March 20)
Deploy to **Polkadot Hub MAINNET** for hackathon judging.

**Network Details:**
- **Name**: Polkadot Hub
- **RPC**: `https://polkadot-asset-hub-rpc.polkadot.io`
- **Chain ID**: `1000`
- **Currency**: DOT
- **Explorer**: https://polkadot.subscan.io

**Deploy to Mainnet:**
```bash
# WARNING: Requires real DOT tokens!
npm run deploy:polkadot-mainnet
npm run setup:polkadot-mainnet
```

## 📝 MetaMask Configuration

### For Testing (Add Now):
- Network Name: **Moonbase Alpha**
- RPC URL: `https://rpc.api.moonbase.moonbeam.network`
- Chain ID: `1287`
- Currency Symbol: `DEV`
- Block Explorer: `https://moonbase.moonscan.io`

### For Mainnet Submission (Add Later):
- Network Name: **Polkadot Hub**
- RPC URL: `https://polkadot-asset-hub-rpc.polkadot.io`
- Chain ID: `1000`
- Currency Symbol: `DOT`
- Block Explorer: `https://polkadot.subscan.io`

## 🚀 Current Progress

### ✅ Completed
- [x] All smart contracts created (14 contracts)
- [x] Cross-chain XCM bridge implemented
- [x] AI risk prediction system integrated
- [x] Multi-chain collateral support (DOT, WBTC)
- [x] Frontend dashboard with AI alerts
- [x] Deployment scripts for both testnet & mainnet

### 🔄 Next Steps
1. **Get testnet tokens** from Moonbase Alpha faucet
2. **Deploy to testnet** with `npm run deploy:polkadot`
3. **Test all features** (deposit, borrow, AI risk, cross-chain)
4. **Update frontend** with deployed contract addresses
5. **Deploy to mainnet** before March 20
6. **Submit to hackathon** with demo video

## 🏗️ Project Architecture

### Smart Contracts (14 total)
1. **MockDOT** - Polkadot native token collateral
2. **MockWBTC** - Wrapped Bitcoin collateral
3. **MockUSDC** - Stablecoin for borrowing
4. **MockRWA** - Real-world asset token
5. **MockYield** - Yield-bearing token
6. **MockOracle** - Price feed oracle
7. **SmartVault** - Main collateral vault
8. **LoanManager** - Loan lifecycle management
9. **CollateralManager** - Risk-weighted collateral
10. **AntiLiquidation** - Liquidation protection
11. **XCMBridge** - Cross-chain bridge (5 chains)
12. **AIRiskPredictor** - AI-powered risk scoring
13. **CrossChainRebalancer** - Auto portfolio optimization
14. **YieldManager** - Yield distribution

### Key Features (Hackathon Highlights)
- ✅ **DeFi Protocol**: Over-collateralized lending
- ✅ **AI Integration**: Real-time risk prediction & alerts
- ✅ **Cross-Chain**: XCM bridge supporting 5 chains
- ✅ **New Collateral**: DOT (85% weight), WBTC (90% weight)
- ✅ **Smart Risk Management**: Dynamic LTV based on AI
- ✅ **Auto Rebalancing**: Cross-chain portfolio optimization

## 📊 Hackathon Submission Checklist

- [ ] Deploy contracts to Polkadot Hub mainnet
- [ ] Verify contracts on explorer
- [ ] Update frontend with mainnet addresses
- [ ] Record demo video showing:
  - [ ] Deposit DOT/WBTC collateral
  - [ ] Borrow USDC
  - [ ] AI risk alerts triggering
  - [ ] Cross-chain collateral view
  - [ ] Liquidation protection activation
- [ ] Prepare pitch deck (problem, solution, tech, roadmap)
- [ ] Submit project to OpenGuild Discord
- [ ] Fill out official hackathon form

## 🔗 Useful Links

- **Hackathon Discord**: https://discord.gg/WWgzkDfPQF
- **Polkadot Docs**: https://docs.polkadot.com/
- **Moonbase Alpha Faucet**: https://faucet.moonbeam.network/
- **Moonscan Explorer**: https://moonbase.moonscan.io
- **Polkadot Subscan**: https://polkadot.subscan.io

## 💡 Tips for Winning

1. **Test Thoroughly**: Use Moonbase Alpha to iron out bugs
2. **Demo Quality**: Clear, smooth video showing all features
3. **Innovation**: Highlight AI risk prediction + XCM bridge
4. **Production Ready**: Deploy to mainnet, not just testnet
5. **Documentation**: Clear README explaining use cases
6. **Pitch**: Explain why DeFi needs AI + cross-chain support

## 🎬 Demo Script Ideas

1. **Problem**: Traditional DeFi lacks cross-chain support and smart risk management
2. **Solution**: SECP Protocol with AI-powered risk scoring + XCM bridge
3. **Live Demo**:
   - Connect wallet to Polkadot Hub
   - Deposit DOT as collateral (new to Polkadot!)
   - Show AI risk score calculation
   - Borrow USDC against collateral
   - Trigger AI alert with simulated volatility
   - Show cross-chain collateral balance
4. **Future**: Expand to all Polkadot parachains, integrate real oracles

Good luck! 🚀
