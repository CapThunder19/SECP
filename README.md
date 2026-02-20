# 🛡️ SECP Protocol

A decentralized lending protocol with multi-asset collateral support, automatic rebalancing, and anti-liquidation protection. Built on Arbitrum Sepolia.

## 🌟 Features

### Core Protocol
- ✅ **Multi-Asset Collateral**: Deposit USDC, Yield tokens, and RWA tokens
- ✅ **Flexible Lending**: Borrow USDC with customizable loan durations
- ✅ **Risk-Weighted Assets**: Different collateral types have different risk weights
- ✅ **Real-Time Oracle**: Dynamic price feeds for all assets
- ✅ **Anti-Liquidation Protection**: Automatic protection during market volatility
- ✅ **Automated Rebalancing**: Portfolio optimization across asset types
- ✅ **Yield Management**: Earn yield on deposited assets

### Frontend
- 🎨 **Modern UI**: Clean, responsive interface with dark mode
- 🔐 **Wallet Integration**: MetaMask, WalletConnect, and more
- 📊 **Real-Time Dashboard**: Live position tracking and health factor monitoring
- ⚡ **Instant Updates**: Automatic data refresh every 10 seconds
- 🎯 **User-Friendly**: Simple deposit, borrow, and repay flows
- 💰 **Built-in Faucet**: Get test tokens directly from the interface

## 📁 Project Structure

```
secp-protocol/
├── smart-contracts/          # Solidity contracts and deployment scripts
│   ├── contracts/           # Smart contract source files
│   ├── scripts/             # Deployment and interaction scripts
│   ├── test/                # Contract tests
│   └── deployments/         # Deployed contract addresses
│
└── frontend/                # Next.js frontend application
    ├── src/
    │   ├── app/            # Next.js pages
    │   ├── components/     # React components
    │   ├── config/         # Configuration (contracts, wagmi)
    │   └── hooks/          # Custom React hooks
    └── public/             # Static assets
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- Git
- MetaMask or another Web3 wallet
- Arbitrum Sepolia testnet ETH

### 1. Smart Contracts (Already Deployed! ✅)

The contracts are already deployed on Arbitrum Sepolia testnet:

```bash
cd smart-contracts
npm install

# View deployment addresses
cat deployments/arbitrum-sepolia.json
```

**Deployed Contracts:**
- SmartVault: `0x2e8026bc45fe0fae2b159a3c82cada12670769e2`
- LoanManager: `0xba5be20d3d96e89ffbf20f9812df73cada28e376`
- CollateralManager: `0xfa7e1a8e4be412b9c7efcbb5f14ddcc5820da599`
- [See all 10 contracts](smart-contracts/deployments/arbitrum-sepolia.json)

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

📖 **Detailed Guide**: See [frontend/QUICKSTART.md](frontend/QUICKSTART.md)

## 🎯 How to Use

### Step-by-Step Guide

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Select MetaMask
   - Switch to Arbitrum Sepolia network

2. **Get Test Tokens**
   - Use the Token Faucet on the page
   - Click "Get 1,000 tokens" for each token type
   - Approve transactions in your wallet

3. **Deposit Collateral**
   - Select a token (USDC, Yield, or RWA)
   - Enter amount
   - Approve and deposit

4. **Borrow USDC**
   - View your max borrowable amount (75% of collateral)
   - Enter borrow amount and duration
   - Confirm transaction

5. **Monitor Position**
   - Watch your health factor (keep it above 1.0)
   - Track collateral value and debt
   - View real-time updates

## 💡 Key Concepts

### Health Factor
Your position's safety indicator:
- **> 1.5**: Safe ✅
- **1.0 - 1.5**: Moderate ⚠️
- **< 1.0**: At Risk ❌ (risk of liquidation)

### Collateral Weights
Different assets have different risk weights affecting their collateral value:
- **RWA Token**: 100% (best)
- **USDC**: 90%
- **Yield Token**: 80%

### Loan-to-Value (LTV)
You can borrow up to **75%** of your collateral value, leaving a safety buffer.

## 📊 Example Scenarios

### Scenario 1: Safe Borrowing
```
Deposit: 1,000 USDC
Collateral Value: $900 (90% weight)
Max Borrow: $675 (75% of collateral)
Health Factor: >2.0 ✅
```

### Scenario 2: Using RWA Tokens
```
Deposit: 600 RWA tokens @ $1.50 each
Collateral Value: $900 (100% weight)
Max Borrow: $675
Health Factor: >2.0 ✅
```

### Scenario 3: Diversified Portfolio
```
Deposit: 
  - 400 USDC = $360 collateral
  - 300 RWA = $450 collateral
  - 200 Yield = $168 collateral
Total Collateral: $978
Max Borrow: $733.50
```

## 🛠️ Development

### Smart Contracts

```bash
cd smart-contracts

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy (already done)
npm run deploy:arbitrum

# Setup protocol
npm run setup:arbitrum

# Interact with protocol
npm run interact:arbitrum
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔒 Security Features

1. **Smart Contract Security**
   - OpenZeppelin battle-tested contracts
   - Comprehensive testing
   - Access control mechanisms

2. **Anti-Liquidation Protection**
   - Automatic protection activation
   - Time-based protection windows
   - Gradual debt repayment

3. **Risk Management**
   - Multiple collateral types
   - Dynamic risk assessment
   - Real-time health factor monitoring

## 🌐 Networks

### Current Deployment
- **Network**: Arbitrum Sepolia (Testnet)
- **Chain ID**: 421614
- **RPC**: https://sepolia-rollup.arbitrum.io/rpc
- **Explorer**: https://sepolia.arbiscan.io

### Adding Network to MetaMask
1. Open MetaMask
2. Click network dropdown
3. "Add Network" → "Add network manually"
4. Enter Arbitrum Sepolia details above

## 📚 Documentation

- [Smart Contracts README](smart-contracts/README.md)
- [Frontend README](frontend/README.md)
- [Frontend Quick Start](frontend/QUICKSTART.md)
- [Deployment Guide](smart-contracts/DEPLOYMENT.md)

## 🧪 Testing

### Smart Contracts
```bash
cd smart-contracts
npm test
```

### Frontend (Manual Testing)
1. Connect wallet
2. Mint test tokens
3. Deposit collateral
4. Borrow USDC
5. Check health factor
6. Verify all UI updates correctly

## 🔧 Technology Stack

### Smart Contracts
- Solidity 0.8.28
- Hardhat 3.1.8
- OpenZeppelin 5.4.0
- Viem for TypeScript integration

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Wagmi (React Hooks for Ethereum)
- RainbowKit (Wallet Connection)
- Viem (Ethereum Library)

## 🐛 Troubleshooting

### Common Issues

**Issue**: Wallet won't connect
- **Solution**: Refresh page, ensure MetaMask is unlocked

**Issue**: Transactions failing
- **Solution**: Check you have testnet ETH for gas fees

**Issue**: Can't deposit
- **Solution**: Make sure to approve token spending first

**Issue**: Data not loading
- **Solution**: Verify you're on Arbitrum Sepolia network

See [QUICKSTART.md](frontend/QUICKSTART.md) for more troubleshooting tips.

## 📈 Roadmap

- [ ] Mainnet deployment
- [ ] Additional token support
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] Governance token
- [ ] Cross-chain support

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Arbitrum for the L2 infrastructure
- Hardhat for development tools
- Next.js and Vercel for frontend framework

## 📞 Support

Need help?
- 📖 Check the documentation
- 🐛 Open an issue on GitHub
- 💬 Review troubleshooting guides
- 🔍 Search on Arbitrum Sepolia explorer

---

**Built with ❤️ for the DeFi community**

🌟 **Star this repo if you found it helpful!**
