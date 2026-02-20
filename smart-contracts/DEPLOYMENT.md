# SECP Protocol - Arbitrum Sepolia Deployment Guide

## Prerequisites

1. **Get Arbitrum Sepolia ETH**
   - Bridge from Ethereum Sepolia: https://bridge.arbitrum.io
   - Or use faucet: https://faucet.quicknode.com/arbitrum/sepolia

2. **Setup Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your private key (without 0x prefix)

3. **Install Dependencies**
   ```bash
   npm install
   ```

## Deployment Steps

### 1. Compile Contracts
```bash
npm run compile
```

### 2. Deploy to Arbitrum Sepolia
```bash
npx hardhat ignition deploy ignition/modules/SECPProtocol.ts --network arbitrumSepolia
```

This will deploy all contracts in order:
- MockUSDC, MockYield, MockRWA (test tokens)
- MockOracle (price feed)
- SmartVault (collateral vault)
- LoanManager (borrowing logic)
- CollateralManager (risk management)
- AntiLiquidation (protection system)
- Rebalancer (adaptive rebalancing)
- YieldManager (yield diversion)

### 3. Save Deployment Addresses

After deployment, the addresses will be saved in:
```
ignition/deployments/chain-421614/deployed_addresses.json
```

Copy these addresses to `scripts/setup.ts` in the `addresses` object.

### 4. Run Setup Script

Configure all contracts with proper settings:
```bash
npx hardhat run scripts/setup.ts --network arbitrumSepolia
```

This will:
- Set oracle prices for all tokens
- Configure asset weights (RWA=100, USDC=90, Yield=80)
- Add supported tokens to vault
- Setup authorizations between contracts
- Configure yield rates

## Verify Contracts (Optional)

First, get an Arbiscan API key from: https://arbiscan.io/myapikey

Then verify contracts:
```bash
npx hardhat verify --network arbitrumSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

Example:
```bash
npx hardhat verify --network arbitrumSepolia 0x123... 0xabc...
```

## Test the Protocol

### Get Test Tokens
```javascript
// Using viem in Hardhat console
const mockUSDC = await hre.viem.getContractAt("MockUSDC", "0x...");
await mockUSDC.write.mint([yourAddress, hre.viem.parseEther("10000")]);
```

### Deposit Collateral
```javascript
const vault = await hre.viem.getContractAt("SmartVault", "0x...");
await mockUSDC.write.approve([vault.address, hre.viem.parseEther("1000")]);
await vault.write.deposit(["0x...", hre.viem.parseEther("1000")]);
```

### Borrow
```javascript
const loanManager = await hre.viem.getContractAt("LoanManager", "0x...");
await loanManager.write.borrow([hre.viem.parseEther("500"), 30n]); // 500 USDC for 30 days
```

### Simulate Market Crash
```javascript
const oracle = await hre.viem.getContractAt("MockOracle", "0x...");
await oracle.write.setVolatility([90n]); // High volatility
```

### Trigger Rebalancing
```javascript
const rebalancer = await hre.viem.getContractAt("Rebalancer", "0x...");
await rebalancer.write.rebalance([yourAddress]);
```

## Quick Commands

```bash
# Compile
npm run compile

# Deploy
npm run deploy:arbitrum

# Setup
npm run setup:arbitrum

# Run tests
npm test

# Hardhat console
npx hardhat console --network arbitrumSepolia
```

## Network Info

- **Network Name**: Arbitrum Sepolia
- **Chain ID**: 421614
- **RPC URL**: https://sepolia-rollup.arbitrum.io/rpc
- **Explorer**: https://sepolia.arbiscan.io
- **Bridge**: https://bridge.arbitrum.io

## Troubleshooting

### "Insufficient funds" error
- Get more Arbitrum Sepolia ETH from faucet

### "Nonce too high" error
```bash
npx hardhat clean
```

### Contract verification failed
- Wait a few minutes after deployment
- Ensure constructor args are correct

## Important Notes

⚠️ **Security Warning**: Never commit your `.env` file or share your private key!

⚠️ **Testnet Only**: These contracts are for testing on Arbitrum Sepolia. Do not use on mainnet without proper audits.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              SECP PROTOCOL                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  SmartVault ◄──► CollateralManager             │
│      ▲              │                           │
│      │              ▼                           │
│      │         Rebalancer ◄──► AntiLiquidation │
│      │              │                           │
│      │              ▼                           │
│  LoanManager ◄──► YieldManager                 │
│      │                                          │
│      ▼                                          │
│  MockOracle                                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Support

For issues or questions, open an issue on GitHub.
