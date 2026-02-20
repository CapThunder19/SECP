'use client';

import { useState } from 'react';
import { Card, Button } from '../ui/Card';
import { useAccount } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { useFaucet } from '@/hooks/useProtocolActions';
import { useTokenBalance } from '@/hooks/useProtocolData';
import { Droplet, Check, AlertCircle, RefreshCw } from 'lucide-react';

const TOKENS = [
  { name: 'USDC', address: CONTRACTS.mockUSDC as `0x${string}`, symbol: 'mUSDC', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  { name: 'Yield', address: CONTRACTS.mockYield as `0x${string}`, symbol: 'mYLD', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { name: 'RWA', address: CONTRACTS.mockRWA as `0x${string}`, symbol: 'mRWA', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
];

function TokenFaucetButton({ token }: { token: typeof TOKENS[0] }) {
  const { claimFaucet, isPending, isSuccess, error } = useFaucet();
  const { balance, isLoading: balLoading } = useTokenBalance(token.address);
  const { address } = useAccount();

  const [localError, setLocalError] = useState('');

  const handleClaim = async () => {
    if (!address) return;
    setLocalError('');
    try {
      claimFaucet(token.address);
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.includes('User rejected') || msg.includes('User denied')) {
        setLocalError('Cancelled.');
      } else {
        setLocalError(msg || 'Transaction failed — please retry.');
      }
    }
  };

  const displayError = (error as any)?.message
    ? formatError((error as any).message)
    : localError;

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleClaim}
        disabled={!address || isPending}
        loading={isPending}
        variant="secondary"
        className="flex flex-col items-center justify-center py-4 gap-1"
      >
        <span className={`font-bold text-lg ${token.color}`}>{token.symbol}</span>
        <span className="text-xs opacity-70">
          {balLoading ? '…' : `Bal: ${parseFloat(balance).toFixed(0)}`}
        </span>
        <span className="text-xs opacity-60">Claim 1,000 free</span>
      </Button>

      {isSuccess && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded">
          <Check className="w-3.5 h-3.5 flex-shrink-0" />
          +1,000 {token.symbol} minted!
        </div>
      )}

      {displayError && (
        <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {displayError}
        </div>
      )}
    </div>
  );
}

function formatError(msg: string): string {
  if (msg.includes('User rejected') || msg.includes('User denied')) return 'Transaction cancelled.';
  if (msg.includes('base fee') || msg.includes('gas')) return 'Gas estimate issue — MetaMask will retry automatically.';
  if (msg.length > 120) return msg.slice(0, 120) + '…';
  return msg;
}

export function Faucet() {
  const { isConnected } = useAccount();

  return (
    <Card>
      <div className="flex items-center space-x-2 mb-1">
        <Droplet className="w-5 h-5 text-blue-500" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Token Faucet</h3>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Arbitrum Sepolia
        </span>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Claim 1,000 free test tokens per button click. Each token has a public faucet — no ownership required.
      </p>

      {!isConnected ? (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
          Connect your wallet to claim tokens.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOKENS.map((token) => (
            <TokenFaucetButton key={token.address} token={token} />
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/40 rounded p-2">
        💡 Each faucet call mints 1,000 tokens directly to your wallet via the contract&apos;s public{' '}
        <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">faucet()</code> function.
        You can call it multiple times.
      </div>
    </Card>
  );
}
