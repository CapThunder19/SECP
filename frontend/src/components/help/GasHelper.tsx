'use client';

import { useState } from 'react';
import { AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

export function GasHelper() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Arbitrum Sepolia Tip: Gas fees on testnet are extremely low (~0.00001 ETH per tx)</span>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-400"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 text-amber-700 dark:text-amber-400 space-y-2 text-xs">
          <p>
            <strong>If MetaMask shows "max fee per gas less than block base fee":</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-1">
            <li>In the MetaMask confirmation popup, click <strong>"Edit"</strong></li>
            <li>Switch to <strong>"Advanced"</strong> gas controls</li>
            <li>Increase <strong>"Max base fee"</strong> by 20% (e.g. 0.000015 → 0.000018)</li>
            <li>Click <strong>Save</strong> then <strong>Confirm</strong></li>
          </ol>
          <p className="mt-1">
            <strong>Or:</strong> Select the <strong>"Aggressive"</strong> preset in MetaMask for automatic gas adjustment.
            Gas is negligible on Arbitrum Sepolia — testnet ETH from the{' '}
            <a
              href="https://www.alchemy.com/faucets/arbitrum-sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              Alchemy faucet
            </a>{' '}
            or{' '}
            <a
              href="https://faucet.triangleplatform.com/arbitrum/sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              Triangle faucet
            </a>
            {' '}covers thousands of transactions.
          </p>
        </div>
      )}
    </div>
  );
}
