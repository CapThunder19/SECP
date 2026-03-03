'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Globe, ArrowRightLeft, Coins } from 'lucide-react';
import { XCMChain, XCM_CHAIN_NAMES } from '@/config/contracts';

interface ChainBalance {
  chain: XCMChain;
  name: string;
  balance: string;
  tokens: Array<{
    symbol: string;
    amount: string;
    value: string;
  }>;
}

export function MultiChainCollateral() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();

  // Mock data - in production, this would fetch from contracts
  const [chainBalances] = useState<ChainBalance[]>([
    {
      chain: XCMChain.PolkadotHub,
      name: XCM_CHAIN_NAMES[XCMChain.PolkadotHub],
      balance: "1,234.56",
      tokens: [
        { symbol: "mDOT", amount: "100.0", value: "850.00" },
        { symbol: "mWBTC", amount: "0.025", value: "1,000.00" },
      ],
    },
    {
      chain: XCMChain.Arbitrum,
      name: XCM_CHAIN_NAMES[XCMChain.Arbitrum],
      balance: "567.89",
      tokens: [
        { symbol: "mUSDC", amount: "500.0", value: "500.00" },
      ],
    },
    {
      chain: XCMChain.Moonbeam,
      name: XCM_CHAIN_NAMES[XCMChain.Moonbeam],
      balance: "0.00",
      tokens: [],
    },
  ]);

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Multi-Chain Collateral
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Connect wallet to view cross-chain positions
        </p>
      </div>
    );
  }

  const totalValue = chainBalances.reduce(
    (sum, chain) => sum + parseFloat(chain.balance),
    0
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Multi-Chain Collateral
          </h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${totalValue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {chainBalances.map((chainBalance) => (
          <ChainBalanceCard
            key={chainBalance.chain}
            {...chainBalance}
            onBridge={() => {
              // Handle bridge action
              console.log(`Bridge from ${chainBalance.name}`);
            }}
          />
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Cross-Chain Transfers Enabled
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Move collateral between chains to optimize your position and reduce fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChainBalanceCardProps extends ChainBalance {
  onBridge: () => void;
}

function ChainBalanceCard({ name, balance, tokens, onBridge }: ChainBalanceCardProps) {
  const hasBalance = parseFloat(balance) > 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">{name}</span>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            ${balance}
          </p>
        </div>
      </div>

      {hasBalance && tokens.length > 0 && (
        <div className="space-y-2 mb-3">
          {tokens.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-600 dark:text-gray-400">
                {token.amount} {token.symbol}
              </span>
              <span className="text-gray-500 dark:text-gray-500">
                ${token.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {hasBalance && (
        <button
          onClick={onBridge}
          className="w-full mt-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Bridge Assets
        </button>
      )}

      {!hasBalance && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          No collateral on this chain
        </p>
      )}
    </div>
  );
}
