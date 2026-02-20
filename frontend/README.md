# SECP Protocol Frontend

A modern, responsive frontend for the SECP Protocol - a decentralized lending platform with multi-asset collateral support, built on Arbitrum Sepolia.

## Features

- 🔐 **Wallet Integration** - Connect with MetaMask, WalletConnect, and other Web3 wallets
- 💰 **Multi-Asset Collateral** - Deposit USDC, Yield tokens, and RWA tokens
- 📊 **Real-time Dashboard** - View your collateral value, debt, and health factor
- 🏦 **Flexible Borrowing** - Borrow USDC against your collateral with customizable durations
- ⚡ **Instant Updates** - Real-time contract data with automatic refresh
- 🎨 **Modern UI** - Clean, responsive design with dark mode support
- 🛡️ **Safety Indicators** - Health factor monitoring and liquidation warnings

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Wagmi** - React hooks for Web3
- **Viem** - Modern Ethereum library
- **RainbowKit** - Beautiful wallet connection UI

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MetaMask or another Web3 wallet
- Arbitrum Sepolia testnet ETH (get from [Arbitrum Faucet](https://faucet.quicknode.com/arbitrum/sepolia))

### Installation

1. **Install dependencies:**

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Configure environment variables:**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get your WalletConnect Project ID from [https://cloud.walletconnect.com](https://cloud.walletconnect.com)

3. **Run the development server:**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

## Contract Addresses (Arbitrum Sepolia)

The frontend is pre-configured with the following deployed contracts:

- **MockUSDC**: `0x4cb63f6ba14e54f3422e3b66955ef5ee690ae2c8`
- **MockYield**: `0x89fa6ae8ae17cdff1b917a31fba44f7bddcd3c62`
- **MockRWA**: `0x3fac055201501b26a8083761655bd1909840c454`
- **SmartVault**: `0x2e8026bc45fe0fae2b159a3c82cada12670769e2`
- **LoanManager**: `0xba5be20d3d96e89ffbf20f9812df73cada28e376`
- **CollateralManager**: `0xfa7e1a8e4be412b9c7efcbb5f14ddcc5820da599`

See `src/config/contracts.ts` for the complete list.

## Usage Guide

### 1. Connect Your Wallet

Click the "Connect Wallet" button in the top right corner and select your preferred wallet.

### 2. Get Test Tokens

Since this is a testnet deployment, you'll need test tokens. You can:
- Use the faucet function in the smart contracts
- Or run the interact script: `npm run interact:arbitrum` in the smart-contracts folder

### 3. Deposit Collateral

1. Select a token (USDC, Yield, or RWA)
2. Enter the amount you want to deposit
3. Click "Deposit Collateral"
4. Approve the transaction in your wallet

### 4. Borrow USDC

1. After depositing collateral, you can borrow up to 75% of its value
2. Enter the borrow amount and duration
3. Click "Borrow USDC"
4. Approve the transaction in your wallet

### 5. Monitor Your Position

- **Collateral Value**: Total value of your deposited assets
- **Debt Amount**: Current borrowed amount
- **Max Borrowable**: Maximum you can borrow based on collateral
- **Health Factor**: Risk indicator (>1.0 is safe, <1.0 at risk)

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout with Web3 provider
│   │   ├── page.tsx           # Main landing page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── dashboard/         # Dashboard components
│   │   │   └── Dashboard.tsx  # User position overview
│   │   ├── forms/             # Form components
│   │   │   ├── DepositForm.tsx
│   │   │   └── BorrowForm.tsx
│   │   ├── layout/            # Layout components
│   │   │   └── Header.tsx
│   │   ├── providers/         # React context providers
│   │   │   └── Web3Provider.tsx
│   │   └── ui/                # Reusable UI components
│   │       └── Card.tsx
│   ├── config/                # Configuration files
│   │   ├── contracts.ts       # Contract addresses
│   │   └── wagmi.ts          # Wagmi configuration
│   └── hooks/                 # Custom React hooks
│       ├── useProtocolData.ts    # Read contract data
│       └── useProtocolActions.ts # Write to contracts
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Key Components

### Dashboard
Displays user's current position including collateral value, debt, health factor, and loan mode.

### DepositForm
Allows users to deposit collateral tokens (USDC, Yield, or RWA) into the protocol.

### BorrowForm
Enables users to borrow USDC against their collateral with customizable loan duration.

## Custom Hooks

### `useProtocolData.ts`
- `useCollateralValue()` - Get user's collateral value
- `useDebt()` - Get user's current debt
- `useHealthFactor()` - Get user's health factor
- `useTokenBalance()` - Get token balance
- `useLoanMode()` - Get user's loan mode

### `useProtocolActions.ts`
- `useDepositCollateral()` - Deposit collateral
- `useBorrow()` - Borrow USDC
- `useRepay()` - Repay debt
- `useMintTokens()` - Mint test tokens

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Build for Production

```bash
npm run build
npm start
```

## Network Configuration

The frontend is currently configured for **Arbitrum Sepolia** testnet. To add support for other networks:

1. Update `src/config/wagmi.ts` to include additional chains
2. Update `src/config/contracts.ts` with network-specific addresses
3. Add network detection logic if needed

## Troubleshooting

### Wallet Connection Issues
- Make sure you're on the Arbitrum Sepolia network in your wallet
- Try refreshing the page after connecting

### Transaction Failures
- Ensure you have enough testnet ETH for gas fees
- Check that you've approved token spending before depositing
- Verify your health factor is safe before borrowing

### Contract Read Errors
- The contract might not be fully configured yet
- Try running the setup script: `npm run setup:arbitrum` in smart-contracts folder

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check the smart contracts documentation
- Review the Arbitrum Sepolia explorer for transaction details

---

Built with ❤️ for the DeFi community
