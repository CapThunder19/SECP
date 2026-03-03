'use client';

import { useEffect, useState } from 'react';
import { useAccount, usePublicClient, useChainId } from 'wagmi';
import { AlertTriangle, ExternalLink } from 'lucide-react';

/**
 * Component that checks if user has enough native tokens (DEV) for gas
 * Shows warning banner if balance is too low
 */
export function GasBalanceChecker() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !publicClient || !isConnected) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    publicClient
      .getBalance({ address })
      .then(setBalance)
      .catch((err) => {
        console.error('Failed to fetch balance:', err);
        setBalance(null);
      })
      .finally(() => setIsLoading(false));
  }, [address, publicClient, isConnected]);

  if (!isConnected || isLoading || balance === null) {
    return null;
  }

  // Show warning if balance is less than 0.1 DEV (for Moonbase Alpha)
  const MIN_BALANCE = BigInt(100000000000000000); // 0.1 DEV
  const balanceNum = Number(balance) / 1e18;

  if (balance >= MIN_BALANCE) {
    return null; // User has enough gas
  }

  // Determine faucet URL based on chain
  const faucetUrl = chainId === 1287 
    ? 'https://faucet.moonbeam.network/'
    : chainId === 421614
    ? 'https://www.alchemy.com/faucets/arbitrum-sepolia'
    : null;

  const nativeToken = chainId === 1287 ? 'DEV' : chainId === 421614 ? 'ETH' : 'tokens';

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-100 dark:bg-amber-800 rounded-xl">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-300" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-lg uppercase tracking-tight text-amber-900 dark:text-amber-100 mb-2">
            Low Gas Balance
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
            Your wallet has only <strong>{balanceNum.toFixed(4)} {nativeToken}</strong>.
            You need native tokens to pay for transaction fees (gas).
          </p>
          {faucetUrl && (
            <a
              href={faucetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-0 hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
            >
              Get Free {nativeToken} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
