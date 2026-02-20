# SECP Protocol - Quick Start Guide

Complete guide to get the SECP Protocol frontend running with your deployed smart contracts.

## 📋 Prerequisites

- ✅ Smart contracts deployed on Arbitrum Sepolia (already done!)
- ✅ Node.js 18+ installed
- ✅ MetaMask or another Web3 wallet
- ✅ Some Arbitrum Sepolia testnet ETH

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure WalletConnect (Optional but Recommended)

1. Visit [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a free account and new project
3. Copy your Project ID
4. Create a `.env.local` file:

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add your Project ID
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

> **Note:** The frontend will work without this, but you'll get a warning in the console.

### Step 3: Start the Development Server

```bash
npm run dev
```

### Step 4: Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 First Time Usage

### 1. Connect Your Wallet

1. Click "Connect Wallet" in the top right
2. Select MetaMask (or your preferred wallet)
3. Make sure you're on **Arbitrum Sepolia** network
4. Approve the connection

### 2. Get Test Tokens

Use the Token Faucet on the page to mint test tokens:
- Click "Get 1,000 tokens" for each token type (USDC, Yield, RWA)
- Approve the transaction in your wallet
- Wait for confirmation

### 3. Deposit Collateral

1. Select a token (USDC recommended for first try)
2. Enter amount (e.g., 100)
3. Click "Deposit Collateral"
4. Approve **two transactions**:
   - First: Approve token spending
   - Second: Deposit transaction

### 4. Borrow USDC

1. After depositing, you can borrow up to 75% of collateral value
2. Enter borrow amount
3. Choose duration (e.g., 30 days)
4. Click "Borrow USDC"
5. Approve the transaction

## 🔍 What You Can Do

### Dashboard Features

- **Collateral Value**: See your total deposited assets value
- **Debt Amount**: Track how much you've borrowed
- **Max Borrowable**: Know your borrowing limit
- **Health Factor**: Monitor your position safety
  - >1.0 = Safe ✅
  - <1.0 = At risk ⚠️

### Available Actions

1. **Deposit**: Add USDC, Yield, or RWA tokens as collateral
2. **Borrow**: Get USDC loans against your collateral
3. **Monitor**: Track your health factor and position
4. **Faucet**: Get test tokens anytime

## 📱 Switching Networks

If you need to switch to Arbitrum Sepolia:

**In MetaMask:**
1. Click network dropdown
2. Select "Add Network"
3. Add Arbitrum Sepolia:
   - Network Name: `Arbitrum Sepolia`
   - RPC URL: `https://sepolia-rollup.arbitrum.io/rpc`
   - Chain ID: `421614`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://sepolia.arbiscan.io`

## 🛠️ Troubleshooting

### "Transaction Failed" Errors

**Problem**: Transactions are failing
**Solutions**:
- Make sure you have enough testnet ETH for gas
- Check you're on Arbitrum Sepolia network
- For deposits, make sure to approve the first transaction before the second

### "Insufficient Funds" Error

**Problem**: Can't complete transaction
**Solutions**:
- Get testnet ETH from [Arbitrum Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
- Get test tokens from the faucet on the page

### Wallet Not Connecting

**Problem**: Wallet connection not working
**Solutions**:
- Refresh the page
- Disconnect and reconnect
- Make sure MetaMask is unlocked
- Clear browser cache

### Data Not Loading

**Problem**: Dashboard shows 0 or doesn't load
**Solutions**:
- Make sure wallet is connected
- Check you're on correct network (Arbitrum Sepolia)
- Refresh the page
- Check browser console for errors

## 📊 Understanding the Interface

### Health Factor Explained

Your health factor indicates position safety:

- **>2.0**: Very Safe - You can borrow more
- **1.5-2.0**: Safe - Good position
- **1.0-1.5**: Moderate - Be cautious
- **<1.0**: At Risk - Add collateral or repay debt

### Collateral Weights

Different assets have different risk weights:
- **RWA Token**: 100% (safest, best collateral)
- **USDC**: 90% (stable, good collateral)
- **Yield Token**: 80% (riskier, lower collateral value)

Example: 100 USDC deposited = $90 collateral value

### Borrowing Limits

You can borrow up to **75%** of your collateral value:
- Deposit $100 worth of collateral
- Borrow up to $75 USDC
- Leave room for price fluctuations

## 🎨 Features Showcase

### Real-time Updates
- Health factor refreshes every 10 seconds
- Balances update after each transaction
- Position automatically recalculates

### Dark Mode
- Automatically matches your system preference
- Toggle in your OS settings

### Responsive Design
- Works on desktop, tablet, and mobile
- Optimized for all screen sizes

## 🔗 Important Links

- **Frontend**: http://localhost:3000
- **Smart Contracts**: `../smart-contracts`
- **Arbitrum Sepolia Explorer**: https://sepolia.arbiscan.io
- **Contract Addresses**: See `src/config/contracts.ts`

## 📝 Next Steps

After setting up, try:

1. **Deposit different tokens** - Compare how RWA, USDC, and Yield tokens affect your collateral value
2. **Test borrowing** - Try small amounts first
3. **Monitor health factor** - Watch how it changes with different positions
4. **Check the explorer** - View your transactions on Arbiscan

## 🆘 Need Help?

- Check the browser console (F12) for detailed errors
- Review transaction hashes on Arbiscan
- Ensure smart contracts are properly deployed and configured
- Verify you have testnet ETH and tokens

## 🎉 Success Checklist

- [ ] Frontend running on localhost:3000
- [ ] Wallet connected to Arbitrum Sepolia
- [ ] Test tokens minted from faucet
- [ ] Collateral deposited successfully
- [ ] Can see dashboard with your position
- [ ] Tested borrowing (optional)

---

🎊 **Congratulations!** Your SECP Protocol frontend is ready to use!

For more details, see the [README.md](README.md) file.
