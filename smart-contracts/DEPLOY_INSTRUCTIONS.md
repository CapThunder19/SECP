# 🚀 Deployment Instructions - FIXED

## ⚠️ Issues Fixed

1. ✅ Fixed OpenZeppelin import path (`ReentrancyGuard` moved to `utils/` in v5)
2. ✅ Created standard Hardhat deployment script (simpler than Ignition)
3. ✅ Added npm scripts for easy deployment

## 📝 Prerequisites

1. **Install dependencies** (if not done):
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the `smart-contracts` folder:
   ```bash
   PRIVATE_KEY=your_private_key_here
   ```

3. **Get testnet funds**:
   - For Westend Asset Hub, get WND tokens from the faucet
   - Make sure your wallet has sufficient balance

## 🎯 Quick Deployment (Recommended)

### Option 1: Using npm scripts (easiest)

```bash
# Compile contracts first
npm run compile

# Deploy to Polkadot Hub testnet
npm run deploy:polkadot

# After deployment, run setup
npm run setup:polkadot
```

### Option 2: Using hardhat commands directly

```bash
# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy-polkadot.ts --network polkadotHubTestnet

# Setup contracts
npx hardhat run scripts/setup-polkadot.ts --network polkadotHubTestnet
```

## 📋 Step-by-Step Process

### Step 1: Compile Contracts
```bash
npm run compile
```

Expected output:
```
Compiled X Solidity files successfully
```

### Step 2: Deploy Contracts
```bash
npm run deploy:polkadot
```

This will:
- Deploy all 14 contracts
- Save addresses to `deployments/polkadotHubTestnet-[timestamp].json`
- Display all contract addresses

Expected output:
```
🚀 Deploying SECP Protocol to Polkadot Hub...

📦 Deploying mock tokens...
✅ MockUSDC deployed to: 0x...
✅ MockYield deployed to: 0x...
✅ MockRWA deployed to: 0x...
✅ MockDOT deployed to: 0x...
✅ MockWBTC deployed to: 0x...

🔮 Deploying oracle...
✅ MockOracle deployed to: 0x...

... (etc)

✨ Deployment complete!
```

### Step 3: Configure Contracts
```bash
npm run setup:polkadot
```

This will:
- Set risk weights for all collateral types
- Whitelist tokens in XCM bridge
- Connect AI predictor and rebalancer
- Initialize market conditions

Expected output:
```
🚀 Setting up SECP Protocol on Polkadot Hub...
📊 Setting up asset risk weights...
✅ DOT weight: 85
✅ WBTC weight: 90
... (etc)
✨ Setup complete!
```

## 🔍 Verify Deployment

After deployment, you'll find a JSON file in `deployments/` folder with all contract addresses.

Example: `deployments/polkadotHubTestnet-1234567890.json`

```json
{
  "network": "polkadotHubTestnet",
  "chainId": "420420421",
  "deployer": "0x...",
  "contracts": {
    "MockDOT": "0x...",
    "MockWBTC": "0x...",
    "XCMBridge": "0x...",
    "AIRiskPredictor": "0x...",
    ...
  }
}
```

## 📝 Update Frontend Config

After successful deployment, copy the contract addresses to your frontend:

1. Open `frontend/src/config/contracts.ts`
2. Update the `westendAssetHub` section with your deployed addresses:

```typescript
westendAssetHub: {
  mockUSDC: "0x...",  // Copy from deployment file
  mockDOT: "0x...",
  mockWBTC: "0x...",
  xcmBridge: "0x...",
  aiRiskPredictor: "0x...",
  // ... etc
}
```

## 🐛 Troubleshooting

### Error: "Task ignition not found"
**Solution**: Use the new deployment script instead:
```bash
npm run deploy:polkadot
```

### Error: "ReentrancyGuard.sol doesn't exist"
**Solution**: Already fixed! The import path has been updated.

### Error: "Insufficient funds"
**Solution**: Get testnet tokens from Westend faucet.

### Error: "Network not found"
**Solution**: Make sure you're using the correct network name:
- Testnet: `polkadotHubTestnet`
- Mainnet: `polkadotHub`

### Compilation errors
**Solution**: 
```bash
npm run clean
npm run compile
```

## 🌐 Deploy to Mainnet

When ready for mainnet deployment:

```bash
# Deploy to Polkadot Hub mainnet
npm run deploy:polkadot-mainnet

# Setup on mainnet
npm run setup:polkadot-mainnet
```

## 📚 Next Steps

1. ✅ Contracts deployed
2. ✅ Contracts configured
3. ⏭️ Update frontend config (see above)
4. ⏭️ Start frontend: `cd ../frontend && npm run dev`
5. ⏭️ Test the application

## 🎉 Success Indicators

You've successfully deployed when:
- ✅ All 14 contracts deployed without errors
- ✅ Setup script completed successfully
- ✅ Deployment JSON file created
- ✅ All contract addresses are non-zero
- ✅ You can query contract data (try reading token balances)

## 🆘 Need Help?

- Check the error message carefully
- Ensure you have sufficient testnet funds
- Verify your private key is set in `.env`
- Make sure you're connected to the correct network
- Review the [POLKADOT_UPGRADE.md](../POLKADOT_UPGRADE.md) documentation

---

**Good luck with your deployment! 🚀**
