# Quick Start Guide - SECP on Polkadot Hub

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Backend
cd smart-contracts
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Create `smart-contracts/.env`:

```bash
PRIVATE_KEY=your_private_key_here
```

### 3. Deploy to Testnet

```bash
cd smart-contracts

# Deploy contracts
npx hardhat ignition deploy ignition/modules/PolkadotHub.ts --network polkadotHubTestnet

# Setup and configure
npx hardhat run scripts/setup-polkadot.ts --network polkadotHubTestnet
```

### 4. Update Frontend Config

Copy deployed addresses to `frontend/src/config/contracts.ts`

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

Visit http://localhost:3000

## 🎯 Try These Features

### Test Cross-Chain Bridge

1. Connect wallet to Westend Asset Hub
2. Get test DOT tokens from faucet
3. Deposit DOT as collateral
4. Click "Bridge Assets" to move to another chain
5. View multi-chain position in dashboard

### Try AI Risk Prediction

1. Deposit various collateral types
2. Borrow stablecoins
3. Watch AI risk alerts update in real-time
4. Enable auto-protection toggle
5. See recommendations based on market conditions

### Test Portfolio Rebalancing

1. Create a diverse collateral position
2. Trigger manual rebalance
3. Watch AI optimize your position across chains
4. See mode changes (Flexible → Conservative → Freeze)

## 🛠️ Developer Commands

```bash
# Smart Contracts
cd smart-contracts

# Compile
npx hardhat compile

# Test
npx hardhat test

# Deploy
npx hardhat ignition deploy ignition/modules/PolkadotHub.ts --network [NETWORK]

# Verify contracts (optional)
npx hardhat verify --network [NETWORK] [CONTRACT_ADDRESS]

# Frontend
cd frontend

# Development
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## 📝 Environment Variables

### Smart Contracts

```bash
# Required
PRIVATE_KEY=0x...

# Optional (for mainnet)
POLKADOT_RPC_URL=https://rpc.polkadot.io
ETHERSCAN_API_KEY=...
```

### Frontend

```bash
# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 🧪 Testing Checklist

- [ ] Deploy all contracts successfully
- [ ] Whitelist all tokens in XCM bridge
- [ ] Set risk weights for collateral types
- [ ] Connect AI predictor to CollateralManager
- [ ] Test faucet functionality for all tokens
- [ ] Test deposit and withdraw operations
- [ ] Test cross-chain bridge (initiate and complete)
- [ ] Test AI risk prediction updates
- [ ] Test auto-protection trigger
- [ ] Test portfolio rebalancing
- [ ] Test frontend wallet connection
- [ ] Test multi-chain dashboard display
- [ ] Test all UI components render correctly

## 🔍 Troubleshooting

### Contract Deployment Fails

- Check you have testnet funds (WND for Westend)
- Verify RPC endpoint is accessible
- Ensure private key is correctly formatted

### Frontend Not Connecting

- Clear browser cache and cookies
- Ensure correct chain ID in wagmi config
- Check contract addresses are updated
- Verify wallet is on correct network

### XCM Bridge Not Working

- Ensure tokens are whitelisted
- Check bridge has sufficient liquidity
- Verify source and destination chains are supported

### AI Risk Alerts Not Showing

- Ensure AI predictor contract is deployed
- Check CollateralManager is connected to AI predictor
- Verify market conditions have been initialized

## 📚 Next Steps

1. **Read Full Documentation**: See [POLKADOT_UPGRADE.md](./POLKADOT_UPGRADE.md)
2. **Explore Smart Contracts**: Check contract source code for details
3. **Customize UI**: Modify frontend components to match your brand
4. **Deploy to Mainnet**: Follow production deployment guide
5. **Add More Chains**: Integrate additional Polkadot parachains

## 🎓 Learn More

- [Polkadot Documentation](https://wiki.polkadot.network/)
- [XCM Overview](https://wiki.polkadot.network/docs/learn-xcm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)

## 🐛 Report Issues

Found a bug? Open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment (OS, Node version, etc.)

---

**Happy Building! 🎉**
