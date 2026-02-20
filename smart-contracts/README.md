# SECP Protocol - Smart Contracts

**Self-Evolving Collateral Protocol**: The first DeFi protocol with intelligent, adaptive collateral management.

## 🌟 What Makes SECP Unique

Traditional DeFi collateral is **static and dumb**:
- Market drops → Instant liquidation 💥
- User must monitor 24/7 👀
- One-size-fits-all rules ❌

**SECP makes collateral intelligent** 🧠:
- Automatically adapts to market conditions 🔄
- Remembers borrower history 📊
- Prevents liquidations through smart rebalancing 🛡️
- Personalizes rules based on user behavior 👤

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│         SECP PROTOCOL ARCHITECTURE              │
├─────────────────────────────────────────────────┤
│                                                 │
│  SmartVault (Multi-Asset Collateral)           │
│      │                                          │
│      ├──► CollateralManager (Risk Analysis)    │
│      │         │                                │
│      │         ├──► Auto Mode Switching         │
│      │         │    • Flexible                  │
│      │         │    • Conservative              │
│      │         │    • Freeze                    │
│      │         │                                │
│      │         └──► Health Factor Calculation   │
│      │                                          │
│      ├──► LoanManager (Borrowing + Memory)     │
│      │         │                                │
│      │         ├──► Time-Aware Loans            │
│      │         └──► Borrower History Tracking   │
│      │                                          │
│      ├──► YieldManager (Yield Diversion)       │
│      │         │                                │
│      │         └──► Auto-Protect via Yield      │
│      │                                          │
│      ├──► Rebalancer (Portfolio Optimization)  │
│      │         │                                │
│      │         └──► Risky → Safe Assets         │
│      │                                          │
│      └──► AntiLiquidation (Last Resort)        │
│              │                                  │
│              └──► Slow Repay Instead of Sell   │
│                                                 │
│  MockOracle (Price Feeds + Volatility)         │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 🎯 Core Features

### 1. **🧠 Borrower Memory**
- Tracks all borrowing history
- Calculates reliability scores
- Personalizes rules for good borrowers
- Penalizes risky behavior

### 2. **⏰ Time-Aware Logic**
- Short-term loans → More flexible
- Long-term loans → More conservative
- On-time repayment tracking
- Duration-based risk adjustment

### 3. **💰 Yield Diversion**
- Auto-routes yield to protect loans
- Locks yield during market stress
- Emergency diversion mechanism
- Prevents unnecessary liquidations

### 4. **🔄 Shape-Shifting Modes**
| Mode | Trigger | Behavior |
|------|---------|----------|
| **Flexible** | Low volatility | Normal operations |
| **Conservative** | Medium volatility | Shift to safer assets |
| **Freeze** | High volatility | Lock + slow repay |

### 5. **📊 Health Factor & LTV**
- Real-time collateralization ratios
- Risk-adjusted asset weights
- Automatic liquidation prevention
- Max borrow calculations

### 6. **🛡️ Anti-Liquidation Vault**
- Freezes collateral during crisis
- Slow repayment (10% per period)
- No forced selling
- Grace period for recovery

## 📁 Project Structure

```
smart-contracts/
├── contracts/
│   ├── vault/
│   │   ├── SmartVault.sol              # Multi-asset vault
│   │   └── CollateralManager.sol       # Risk management + modes
│   ├── lending/
│   │   └── LoanManager.sol             # Borrowing + history
│   ├── yield/
│   │   └── YieldManager.sol            # Yield diversion
│   ├── rebalance/
│   │   └── Rebalancer.sol              # Portfolio optimization
│   ├── protection/
│   │   └── AntiLiquidation.sol         # Emergency protection
│   ├── oracle/
│   │   └── MockOracle.sol              # Price feeds
│   └── tokens/
│       ├── MockUSDC.sol                # Test stablecoin
│       ├── MockYield.sol               # Test yield token
│       └── MockRWA.sol                 # Test RWA token
├── ignition/modules/
│   └── SECPProtocol.ts                 # Deployment module
├── scripts/
│   ├── setup.ts                        # Post-deployment config
│   └── interact.ts                     # Interaction examples
├── test/
│   └── SECPProtocol.ts                 # Integration tests
└── DEPLOYMENT.md                       # Deployment guide
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
# Edit .env and add your PRIVATE_KEY
```

### 3. Compile Contracts
```bash
npm run compile
```

### 4. Run Tests
```bash
npm test
```

### 5. Deploy to Arbitrum Sepolia
```bash
# Get Arbitrum Sepolia ETH from: https://faucet.quicknode.com/arbitrum/sepolia
npm run deploy:arbitrum
```

### 6. Configure Protocol
```bash
# Update addresses in scripts/setup.ts
npm run setup:arbitrum
```

### 7. Interact with Protocol
```bash
# Update addresses in scripts/interact.ts
npx hardhat run scripts/interact.ts --network arbitrumSepolia
```

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[scripts/interact.ts](./scripts/interact.ts)** - Usage examples

## 🔧 Available Commands

```bash
npm run compile            # Compile contracts
npm test                   # Run tests
npm run deploy:arbitrum    # Deploy to Arbitrum Sepolia
npm run setup:arbitrum     # Configure deployed contracts
npm run console:arbitrum   # Open Hardhat console
npm run clean              # Clean artifacts
```

## 🌐 Network Information

**Arbitrum Sepolia Testnet**
- Chain ID: 421614
- RPC: https://sepolia-rollup.arbitrum.io/rpc
- Explorer: https://sepolia.arbiscan.io
- Faucet: https://faucet.quicknode.com/arbitrum/sepolia

## 🧪 Testing the Protocol

### Basic Flow
1. **Get test tokens** → Faucet
2. **Deposit collateral** → SmartVault
3. **Borrow** → LoanManager (tracks time + history)
4. **Monitor** → CollateralManager auto-switches modes
5. **Simulate crash** → Oracle volatility increase
6. **Watch protection** → Auto-rebalancing + yield diversion

### Example Scenario
```javascript
// 1. Deposit $1000 USDC
await vault.deposit(USDC, parseEther("1000"));

// 2. Borrow $500 for 30 days
await loanManager.borrow(parseEther("500"), 30);

// 3. Market crash simulation
await oracle.setVolatility(90); // Emergency level

// 4. Auto-protection activates
await rebalancer.rebalance(userAddress);
// → Shifts to stable assets
// → Activates anti-liquidation
// → Diverts yield to repay loan
```

## 🔐 Security Features

✅ Access control on all critical functions  
✅ Reentrancy protection  
✅ Emergency pause mechanisms  
✅ Comprehensive event logging  
✅ Time-locked operations  
✅ Multi-sig compatible (Ownable)

## 📊 Contract Addresses (Arbitrum Sepolia)

After deployment, your addresses will be saved in:
```
ignition/deployments/chain-421614/deployed_addresses.json
```

## 🛠️ Technology Stack

- **Solidity** 0.8.28
- **Hardhat** 3.1.8
- **OpenZeppelin** 5.4.0
- **Viem** 2.46.1
- **TypeScript** 5.8.0

## 📝 License

MIT

## 🤝 Contributing

This is a hackathon/research project. For production use, conduct thorough audits.

## ⚠️ Disclaimer

These contracts are for testing on Arbitrum Sepolia testnet only. Not audited. Do not use on mainnet without proper security audits.

## 📞 Support

Questions or issues? Open a GitHub issue.

---

Built with ❤️ for the future of intelligent DeFi
