# 🌉 XCM Cross-Chain Deposit Guide

## Overview

SECP Protocol now supports **cross-chain collateral deposits via XCM (Cross-Consensus Messaging)**! Users can deposit collateral from multiple Polkadot parachains and bridged chains.

### 🎯 Key Changes

1. **USDC is ONLY for Borrowing** - You can no longer deposit USDC as collateral. USDC is exclusively a borrowable asset.
2. **Multi-Chain Deposits** - Deposit DOT, WBTC, RWA, and Yield tokens from any supported chain
3. **Automatic Bridging** - XCM handles cross-chain transfers automatically
4. **Direct Collateralization** - Cross-chain deposits are automatically added to your vault as collateral

---

## 🪙 Supported Collateral Tokens

| Token | Symbol | Risk Weight | Description |
|-------|--------|-------------|-------------|
| Polkadot | mDOT | 85% | Native Polkadot token |
| Wrapped Bitcoin | mWBTC | 90% | Bitcoin on Polkadot (8 decimals) |
| Real World Assets | mRWA | 80% | Tokenized real-world assets |
| Yield Token | mYLD | 75% | Yield-bearing token |

**❌ USDC is NOT collateral** - You can only **borrow** USDC, not deposit it.

---

## 🌐 Supported Chains

| Chain | Chain ID | Status | Best For |
|-------|----------|--------|----------|
| **Polkadot Hub** | 1000 | ✅ Active | DOT, WBTC deposits |
| **Moonbeam** | 2004 | ✅ Active | EVM compatibility, all tokens |
| **Acala** | 2000 | ✅ Active | DeFi assets |
| **Astar** | 2006 | ✅ Active | dApp staking |
| **Arbitrum** | 42161 | ✅ Active | Ethereum L2 bridge |

---

## 📝 How to Deposit Collateral

### Via Frontend (Recommended)

1. **Access Deposit Page**
   - Navigate to http://localhost:3000/deposit
   - Connect your wallet (MetaMask, etc.)
   - Ensure you're on the correct network (Moonbase Alpha testnet recommended)

2. **Select Source Chain**
   - Choose where your tokens are currently located:
     - Polkadot Hub
     - Moonbeam
     - Acala
     - Astar
     - Arbitrum

3. **Select Collateral Token**
   - Choose from: mDOT, mWBTC, mRWA, or mYLD
   - View the risk weight percentage
   - See your wallet balance

4. **Enter Amount**
   - Input the amount to deposit
   - Click "MAX" to deposit everything
   - Preview shows:
     - Risk-adjusted collateral value
     - Weighted USD value

5. **Confirm Transaction**
   - **Step 1/2:** Approve token spending (MetaMask popup)
   - **Step 2/2:** Initiate cross-chain deposit (MetaMask popup)
   - Wait for XCM message confirmation
   - Collateral appears in your vault automatically

### Via Smart Contract

```solidity
// 1. Initiate cross-chain deposit
bytes32 depositId = xcmBridge.initiateCrossChainDeposit(
    userAddress,
    tokenAddress,
    amount,
    XCMChain.Moonbeam  // Source chain: 0=Hub, 1=Moonbeam, 2=Acala, 3=Astar, 4=Arbitrum
);

// 2. Complete deposit (after XCM confirmation) - deposits directly to vault
xcmBridge.completeCrossChainDeposit(depositId, true);
```

### Using TypeScript Hooks

```typescript
import { useCrossChainDepositCollateral } from '@/hooks/useXCMProtocol';
import { XCMChain } from '@/config/contracts';

function MyComponent() {
  const { depositFromChain, isPending, isSuccess } = useCrossChainDepositCollateral();

  const handleDeposit = async () => {
    await depositFromChain(
      tokenAddress as `0x${string}`,
      "100",  // Amount
      XCMChain.Moonbeam  // Source chain
    );
  };

  return (
    <button onClick={handleDeposit} disabled={isPending}>
      {isPending ? 'Depositing...' : 'Deposit from Moonbeam'}
    </button>
  );
}
```

---

## 🔄 Workflow Example

### Scenario: Deposit 100 DOT from Polkadot Hub

1. **User has 100 DOT on Polkadot Hub**
2. **Selects "Polkadot Hub" as source chain**
3. **Selects "mDOT" token**
4. **Enters 100 DOT**
5. **Clicks "Deposit from Polkadot Hub"**
6. **Approves spending** (MetaMask popup 1)
7. **Initiates XCM transfer** (MetaMask popup 2)
8. **XCM Bridge processes transfer** (automatic)
9. **Collateral appears in vault** (automatic)
10. **Can immediately borrow against it**

### Cross-Chain Collateral Value

```
100 DOT × $6.00 price × 85% risk weight = $510 collateral value
Max Borrow = $510 × 75% LTV = $382.50 USDC
```

---

## 🛡️ Smart Contract Architecture

### Updated Contracts

#### **SmartVault.sol**
- ✅ Added `usdcToken` address (borrowable only)
- ✅ Added `depositFromCrossChain()` for XCM deposits
- ✅ Rejects USDC deposits with error message
- ✅ Connected to XCM Bridge

#### **XCMBridge.sol**
- ✅ Added `smartVault` address
- ✅ Updated `completeCrossChainDeposit()` with `depositToVault` parameter
- ✅ Automatic collateral deposit via `depositFromCrossChain()`

#### **CollateralManager.sol**
- ✅ Tracks cross-chain collateral per chain
- ✅ Applies 95% safety discount on cross-chain assets
- ✅ Integrates with XCM bridge for multi-chain value calculation

---

## 🔧 Setup & Configuration

### Deploy Contracts

```bash
cd smart-contracts

# Deploy to testnet
npx hardhat ignition deploy ignition/modules/PolkadotHub.ts --network moonbaseAlpha

# Configure contracts
npx hardhat run scripts/setup-polkadot.ts --network moonbaseAlpha
```

### Configuration Script Does:

1. ✅ Sets risk weights for all tokens (DOT: 85, WBTC: 90, RWA: 80, Yield: 75)
2. ✅ Whitelists tokens in XCM Bridge
3. ✅ Connects XCM Bridge to SmartVault
4. ✅ **Sets USDC as borrowable-only in SmartVault**
5. ✅ **Connects SmartVault to XCM Bridge**
6. ✅ Initializes AI risk predictor
7. ✅ Sets asset types for cross-chain rebalancer

---

## 📊 User Experience

### Before

```
❌ Deposit USDC as collateral → Borrow USDC
   (Same asset as collateral and loan = inefficient)
```

### After

```
✅ Deposit DOT/WBTC/RWA/Yield → Borrow USDC
   (Different assets = proper collateralization)
   
✅ Deposit from ANY supported chain
   (Polkadot Hub, Moonbeam, Acala, Astar, Arbitrum)
   
✅ Automatic XCM bridging
   (Seamless cross-chain experience)
```

---

## 🚨 Important Notes

### USDC Restriction

**Why USDC is NOT collateral:**
- Using the same asset as collateral and debt creates circular risk
- USDC is designed as the stablecoin to borrow
- Prevents inefficient capital use
- You can only **borrow** USDC, not deposit it

### Cross-Chain Safety

- **5% Cross-Chain Discount**: Cross-chain collateral gets a 95% value multiplier for safety
- **Risk Weights Applied**: Each token has its own risk weight (DOT: 85%, WBTC: 90%, etc.)
- **Health Factor Monitoring**: AI continuously monitors your position across all chains

### Gas & Fees

- **2 Transactions Required**: Approve + Deposit
- **XCM Message Fees**: Small fee for cross-chain messaging (paid in native token)
- **Moonbase Alpha**: Typical gas ~0.0001 DEV per transaction

---

## 🧪 Testing Guide

### Test Cross-Chain Deposit

```bash
# 1. Start frontend
cd frontend
npm run dev

# 2. Connect to Moonbase Alpha
# 3. Get test tokens from faucet
# 4. Try depositing from different chains
# 5. Check vault balance increases
# 6. Try borrowing USDC
```

### Test USDC Restriction

```solidity
// This should FAIL:
smartVault.deposit(usdcToken, 1000); 
// Error: "USDC is borrowable only, not depositable as collateral"

// This should SUCCEED:
smartVault.deposit(dotToken, 1000);
// Success: DOT added to collateral
```

---

## 📈 Advanced Features

### Multi-Chain Portfolio Optimization

The AI-powered cross-chain rebalancer automatically:
- Monitors your collateral across all chains
- Suggests optimal chain allocation
- Moves assets to chains with:
  - Best liquidity
  - Lowest fees
  - Highest safety

### Example Optimization

```
User deposits:
- 100 DOT on Moonbeam
- 1 WBTC on Arbitrum
- 500 RWA on Polkadot Hub

AI suggests:
- Move DOT to Polkadot Hub (native chain, lower fees)
- Keep WBTC on Arbitrum (good liquidity)
- Keep RWA on Polkadot Hub (already optimal)
```

---

## 🔗 Resources

- [Main README](./README.md)
- [Polkadot Upgrade Guide](./POLKADOT_UPGRADE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Quick Start Guide](./QUICKSTART_POLKADOT.md)

---

## 🐛 Troubleshooting

### "USDC is borrowable only" Error

**Problem:** Trying to deposit USDC as collateral  
**Solution:** Use DOT, WBTC, RWA, or Yield tokens instead

### Cross-Chain Deposit Not Completing

**Problem:** Deposit initiated but not showing in vault  
**Solution:** 
1. Check XCM message status
2. Wait 30-60 seconds for confirmation
3. Manually complete deposit if needed:
   ```typescript
   await xcmBridge.completeCrossChainDeposit(depositId, true);
   ```

### Token Not Showing in Dropdown

**Problem:** Can't find token when depositing  
**Solution:**
1. Ensure wallet is connected
2. Check you're on correct network
3. Verify token is whitelisted in XCM Bridge
4. USDC won't appear (it's not collateral)

---

## 📞 Support

Need help? Check:
- Documentation in `/docs`
- Smart contract comments
- Frontend hook examples
- Test files in `/test`

Happy cross-chain lending! 🚀
