# 🌉 Cross-Chain Bridge - User Guide

## Overview

The SECP Protocol now supports **real cross-chain deposits** between testnets using an automated bridge relayer. You can deposit tokens from one chain (like Sepolia) and have them automatically credited as collateral on Moonbase Alpha.

## Architecture

```
User on Sepolia              Bridge Relayer              Moonbase Alpha
     │                              │                           │
     │  1. Lock tokens              │                           │
     │────────────────────────────► │                           │
     │                              │                           │
     │  2. Initiate deposit         │                           │
     │──────────────────────────────┼──────────────────────────►│
     │                              │                           │
     │                              │  3. Detect event          │
     │                              │◄──────────────────────────│
     │                              │                           │
     │                              │  4. Complete deposit      │
     │                              │──────────────────────────►│
     │                              │                           │
     │                           ✅ Done                    ✅ Collateral
     │                                                         credited
```

## Setup

### 1. Install Dependencies

```bash
cd smart-contracts
npm install
```

### 2. Configure Environment

Create/update `.env`:

```env
PRIVATE_KEY=your_private_key_here
POLKADOT_HUB_TESTNET_RPC_URL=https://rpc.api.moonbase.moonbeam.network
```

### 3. Get Testnet Tokens

- **Moonbase Alpha (DEV)**: https://apps.moonbeam.network/moonbase-alpha/faucet/
- **Sepolia (ETH)**: https://sepoliafaucet.com/

## Quick Start

### Option 1: Test on Moonbase Alpha (Quickest)

**Terminal 1 - Start Relayer:**
```bash
npm run bridge:relayer
```

**Terminal 2 - Test Bridge:**
```bash
npm run bridge:test
```

You'll see:
1. Test script deposits 10 mDOT and initiates cross-chain transfer
2. Relayer detects the deposit event
3. After 5 seconds (simulating XCM message time), relayer completes the deposit
4. Collateral is automatically credited to SmartVault

### Option 2: Test Between Sepolia and Moonbase

**Step 1: Deploy bridge on Sepolia**
```bash
npx hardhat run scripts/deploy-bridge-sepolia.ts --network sepolia
```

**Step 2: Start relayer (watches both chains)**
```bash
npm run bridge:relayer
```

**Step 3: From Sepolia wallet, deposit tokens**
- The relayer will detect and automatically complete the transfer to Moonbase

## How It Works

### 1. User Initiates Deposit

User calls `XCMBridge.initiateCrossChainDeposit()`:

```solidity
function initiateCrossChainDeposit(
    address user,
    address token,
    uint256 amount,
    Chain sourceChain  // Acala, Astar, Sepolia, etc.
)
```

This:
- Creates a unique deposit ID
- Emits `CrossChainDepositInitiated` event
- Marks transfer as pending

### 2. Bridge Relayer Watches Events

The relayer runs 24/7 monitoring for deposit events on both chains:

```typescript
watchEvent({
  event: CrossChainDepositInitiated,
  onLogs: async (logs) => {
    // Automatically process each deposit
  }
})
```

### 3. Relayer Completes Deposit

When event detected, relayer:
1. Waits 5 seconds (simulating XCM message propagation)
2. Calls `completeCrossChainDeposit(depositId, true)`
3. Bridge transfers tokens to SmartVault
4. SmartVault credits user's collateral

### 4. User Can Borrow

Collateral is now available! User can:
- See their balance in dashboard
- Borrow USDC against the collateral
- Withdraw back to any chain

## Frontend Integration

The frontend automatically detects which chain is selected and routes to the correct bridge:

```typescript
// When user selects "Acala" as source chain
if (isLocalDeposit) {
  // Regular deposit on current chain
  await deposit(token, amount);
} else {
  // Cross-chain deposit via bridge
  await depositFromChain(token, amount, sourceChain);
}
```

## Supported Chains

Currently configured:

| Chain | ID | Status |
|-------|----|----|
| **Moonbase Alpha** | 1287 | ✅ Live |
| **Sepolia** | 11155111 | ✅ Ready |
| Acala | 2000 | 🔄 Simulated |
| Astar | 2006 | 🔄 Simulated |
| Arbitrum Sepolia | 421614 | 🔄 Simulated |

## Testing Scenarios

### Test 1: Same-Chain Deposit (Fastest)

```bash
# Start relayer
npm run bridge:relayer

# In another terminal
npm run bridge:test
```

Expected output:
```
🧪 Testing Cross-Chain Bridge
✅ Tokens locked
✅ Cross-chain deposit initiated
🔔 Relayer detected deposit
⏳ Simulating XCM message (5s)
✅ Deposit completed
🎉 Collateral credited to SmartVault
```

### Test 2: Cross-Chain (Full Flow)

1. Deploy on Sepolia: `npm run bridge:deploy-sepolia`
2. Start relayer (watches both chains)
3. From Sepolia, mint tokens and deposit
4. Watch relayer complete transfer to Moonbase
5. Check balance on Moonbase frontend

## Monitoring

### View Relayer Logs

The relayer outputs detailed logs:

```
🌉 Bridge Relayer Starting...
Relayer Address: 0x06CAdb961aC800B4Bc11f0E5e7C7634810972536
Moonbase Balance: 0.5432 DEV
👀 Watching Moonbase bridge for deposits...
✅ Relayer is running. Press Ctrl+C to stop.

🔔 New deposit detected on Moonbase!
   Deposit ID: 0xabc123...
   User: 0x456...
   Token: 0x789...
   Amount: 10.0000
   Source: Acala
   ⏳ Simulating XCM message propagation (5 seconds)...
   📝 Completing cross-chain deposit...
   ✅ Deposit completed successfully!
   🎉 User can now borrow against this collateral
```

### Check Bridge Status

```bash
# View pending deposits
npx hardhat run scripts/check-bridge-status.ts --network moonbaseAlpha
```

## Troubleshooting

### "No balance" error

**Solution**: Get testnet tokens from faucets listed above

### "Event not detected" 

**Solution**: Make sure relayer is running before initiating deposit

### "Deposit already processed"

**Solution**: Each deposit can only be completed once. Initiate a new deposit.

### Relayer stopped working

**Solution**: Restart the relayer. It will catch up on missed events.

## Production Deployment

For mainnet deployment:

1. Deploy bridge contracts on all supported chains
2. Run relayer on a reliable server (AWS, DigitalOcean, etc.)
3. Set up monitoring and alerting
4. Configure backup relayers for redundancy
5. Implement proper key management (use AWS KMS or similar)

## Security Considerations

- ✅ Only whitelisted tokens can be bridged
- ✅ Reentrancy protection on all bridge functions
- ✅ Deposits can only be completed once (prevents double-spend)
- ✅ Only bridge can credit SmartVault collateral
- ⚠️ Relayer has privileged access (use secure key storage in production)

## API Reference

### XCMBridge Contract

```solidity
// Initiate cross-chain deposit
initiateCrossChainDeposit(user, token, amount, sourceChain) → depositId

// Complete deposit (relayer only)
completeCrossChainDeposit(depositId, depositToVault)

// Withdraw to another chain
withdrawToCrossChain(token, amount, destinationChain)

// View pending transfers
getPendingTransfers(user, chain) → amount

// Admin: whitelist token
whitelistToken(token, status)
```

### Frontend Hooks

```typescript
// Use cross-chain deposit
const { depositFromChain, isPending, isSuccess, error } = 
  useCrossChainDepositCollateral();

await depositFromChain(tokenAddress, amount, sourceChain);
```

## Next Steps

1. ✅ Start the relayer
2. ✅ Test a deposit
3. ✅ Watch it automatically complete
4. ✅ Borrow against your cross-chain collateral!

---

**Need help?** Check the logs, they're very verbose and show exactly what's happening at each step.
