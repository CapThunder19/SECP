'use client';

import { useState } from 'react';
import { Card, Button, Input } from '../ui/Card';
import { useDepositCollateral } from '@/hooks/useProtocolActions';
import { useTokenBalance } from '@/hooks/useProtocolData';
import { getContractsForChain, XCMChain, XCM_CHAIN_NAMES } from '@/config/contracts';
import { Check, AlertCircle, Info, Globe } from 'lucide-react';
import { useChainId } from 'wagmi';

function formatError(msg: string): string {
  if (!msg) return '';
  if (msg.includes('User rejected') || msg.includes('User denied')) return 'Transaction cancelled by user.';
  if (msg.includes('base fee') || msg.includes('underpriced'))
    return 'Gas estimate was slightly off — please try again, MetaMask will auto-adjust.';
  if (msg.includes('allowance') || msg.includes('ERC20')) return 'Token allowance error — approval may have failed. Please try again.';
  if (msg.length > 150) return msg.slice(0, 150) + '…';
  return msg;
}

export function DepositForm() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  
  // Define collateral tokens - USDC is ONLY for borrowing, NOT collateral
  const TOKENS = [
    { name: 'DOT', address: contracts.mockDOT as `0x${string}`, symbol: 'mDOT', weight: 85, color: 'border-pink-400 bg-pink-50 dark:bg-pink-900/20' },
    { name: 'WBTC', address: contracts.mockWBTC as `0x${string}`, symbol: 'mWBTC', weight: 90, color: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' },
    { name: 'RWA Token', address: contracts.mockRWA as `0x${string}`, symbol: 'mRWA', weight: 80, color: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' },
    { name: 'Yield Token', address: contracts.mockYield as `0x${string}`, symbol: 'mYLD', weight: 75, color: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' },
  ];
  
  // XCM Chain options for cross-chain deposits
  const XCM_CHAINS = [
    { chain: XCMChain.PolkadotHub, name: XCM_CHAIN_NAMES[XCMChain.PolkadotHub], enabled: true },
    { chain: XCMChain.Moonbeam, name: XCM_CHAIN_NAMES[XCMChain.Moonbeam], enabled: true },
    { chain: XCMChain.Acala, name: XCM_CHAIN_NAMES[XCMChain.Acala], enabled: true },
    { chain: XCMChain.Astar, name: XCM_CHAIN_NAMES[XCMChain.Astar], enabled: true },
    { chain: XCMChain.Arbitrum, name: XCM_CHAIN_NAMES[XCMChain.Arbitrum], enabled: true },
  ];

  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [selectedChain, setSelectedChain] = useState<XCMChain>(XCMChain.PolkadotHub);
  const [amount, setAmount] = useState('');
  const { deposit, isPending, isSuccess, error, step } = useDepositCollateral();
  const { balance } = useTokenBalance(selectedToken.address);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    try {
      await deposit(selectedToken.address, amount);
      setAmount('');
    } catch {
      // error is already captured in hook state
    }
  };

  const setMaxAmount = () => {
    const bal = parseFloat(balance);
    if (bal > 0) setAmount(bal.toString());
  };

  const amountNum = parseFloat(amount || '0');
  const balNum = parseFloat(balance);
  const weightedValue = amountNum * (selectedToken.weight / 100);

  return (
    <Card title="Deposit Collateral via XCM">
      <div className="space-y-4">
        {/* Source Chain Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Source Chain
          </label>
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(Number(e.target.value) as XCMChain)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {XCM_CHAINS.map((chain) => (
              <option key={chain.chain} value={chain.chain} disabled={!chain.enabled}>
                {chain.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Select the blockchain where your tokens are located
          </p>
        </div>

        {/* Token Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Collateral Token
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TOKENS.map((token) => (
              <button
                key={token.address}
                onClick={() => { setSelectedToken(token); setAmount(''); }}
                className={`px-3 py-3 rounded-lg border-2 transition-all text-left ${selectedToken.address === token.address
                  ? `${token.color} border-opacity-100`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <div className="text-sm font-bold text-gray-900 dark:text-white">{token.symbol}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Weight: {token.weight}%</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            💡 USDC can only be borrowed, not deposited as collateral
          </p>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Wallet: <span className="font-medium">{parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedToken.symbol}</span>
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-16"
              min="0"
            />
            <button
              onClick={setMaxAmount}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            >
              MAX
            </button>
          </div>
          {amountNum > balNum && balNum > 0 && (
            <p className="text-xs text-red-500 mt-1">Amount exceeds your balance.</p>
          )}
        </div>

        {/* Deposit Preview */}
        {amountNum > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Depositing</span>
              <span className="font-medium text-gray-900 dark:text-white">{amountNum.toFixed(4)} {selectedToken.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Risk weight</span>
              <span className="font-medium text-gray-900 dark:text-white">{selectedToken.weight}%</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Collateral Value Added</span>
              <span className="font-bold text-gray-900 dark:text-white">~{weightedValue.toFixed(4)} USD</span>
            </div>
          </div>
        )}

        {/* 2-step info */}
        {amountNum > 0 && !isPending && !isSuccess && (
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded p-2">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
            <span>
              Deposit requires <strong>2 wallet confirmations</strong>: first approve token spending, then deposit into the vault. <span className="text-blue-600 dark:text-blue-400 font-medium">Cross-chain deposits via XCM will be bridged automatically.</span>
            </span>
          </div>
        )}

        {/* Pending steps */}
        {isPending && (
          <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded p-3 flex items-center gap-2">
            <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>
              {step === 'approving' && '(1/2) Approving token spend — confirm in MetaMask…'}
              {step === 'depositing' && '(2/2) Depositing into vault — confirm in MetaMask…'}
              {step === 'idle' && 'Waiting for confirmation…'}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Transaction Failed</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{formatError((error as any).message ?? '')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {isSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <Check className="w-4 h-4 flex-shrink-0" />
            Deposit successful! Your collateral from {XCM_CHAIN_NAMES[selectedChain]} has been added to the vault.
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleDeposit}
          disabled={!amount || amountNum <= 0 || amountNum > balNum || isPending}
          loading={isPending}
          fullWidth
          variant="primary"
        >
          {step === 'approving' ? 'Step 1/2: Approving…' :
            step === 'depositing' ? 'Step 2/2: Depositing…' :
              `Deposit from ${XCM_CHAIN_NAMES[selectedChain]}`}
        </Button>
      </div>
    </Card>
  );
}
