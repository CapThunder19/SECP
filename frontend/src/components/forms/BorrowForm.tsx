'use client';

import { useState } from 'react';
import { Card, Button, Input } from '../ui/Card';
import { useBorrow, useRepay } from '@/hooks/useProtocolActions';
import { useDebt, useMaxBorrow, useTokenBalance } from '@/hooks/useProtocolData';
import { CONTRACTS } from '@/config/contracts';
import { Check, AlertCircle, Info } from 'lucide-react';

const DURATION_PRESETS = [7, 14, 30, 90, 180];

function formatError(msg: string): string {
  if (!msg) return '';
  if (msg.includes('User rejected') || msg.includes('User denied')) return 'Transaction cancelled.';
  if (msg.includes('base fee') || msg.includes('underpriced')) return 'Gas estimate off — please try again.';
  if (msg.includes('Active loan')) return 'You already have an active loan. Please repay it fully before borrowing again.';
  if (msg.length > 150) return msg.slice(0, 150) + '…';
  return msg;
}

// Repay sub-section
function RepaySection({ debt }: { debt: string }) {
  const [repayAmount, setRepayAmount] = useState('');
  const { repay, isPending: repayPending, isSuccess: repaySuccess, error: repayError } = useRepay();
  const { balance: usdcBalance } = useTokenBalance(CONTRACTS.mockUSDC as `0x${string}`);

  const debtNum = parseFloat(debt);
  const repayNum = parseFloat(repayAmount || '0');

  if (debtNum <= 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Repay Debt</p>

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Outstanding Debt: <strong className="text-red-500">${debtNum.toFixed(4)}</strong></span>
        <span>USDC Balance: <strong>{parseFloat(usdcBalance).toFixed(2)}</strong></span>
      </div>

      <div className="relative">
        <Input
          type="number"
          placeholder="0.00"
          value={repayAmount}
          onChange={(e) => setRepayAmount(e.target.value)}
          className="pr-20"
        />
        <button
          onClick={() => setRepayAmount(debt)}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
        >
          FULL
        </button>
      </div>

      {repayPending && (
        <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded p-2 flex items-center gap-2">
          <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Approving and repaying… confirm in MetaMask.
        </div>
      )}

      {repayError && (
        <p className="text-xs text-red-500">{formatError((repayError as any).message ?? '')}</p>
      )}

      {repaySuccess && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
          <Check className="w-3.5 h-3.5" /> Repayment successful!
        </div>
      )}

      <Button
        onClick={() => repay(repayAmount)}
        disabled={!repayAmount || repayNum <= 0 || repayNum > debtNum || repayPending}
        loading={repayPending}
        fullWidth
        variant="danger"
      >
        {repayPending ? 'Repaying…' : 'Repay USDC'}
      </Button>
    </div>
  );
}

export function BorrowForm() {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const { borrow, isPending, isSuccess, error } = useBorrow();
  const { maxBorrow, isLoading: maxLoading } = useMaxBorrow();
  const { debt: currentDebt } = useDebt();

  const maxBorrowNum = parseFloat(maxBorrow);
  const debtNum = parseFloat(currentDebt);
  const availableToBorrow = Math.max(0, maxBorrowNum - debtNum);
  const amountNum = parseFloat(amount || '0');
  const estimatedInterest = amountNum * 0.05 * (parseInt(duration || '0') / 365);

  const handleBorrow = () => {
    if (!amount || amountNum <= 0) return;
    borrow(amount, parseInt(duration));
    setAmount('');
  };

  return (
    <Card title="Borrow USDC">
      <div className="space-y-4">
        {/* Position Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700 dark:text-blue-300">Max Borrow (contract)</span>
            <span className="font-medium text-blue-900 dark:text-blue-100">
              {maxLoading ? '…' : `$${maxBorrowNum.toFixed(4)}`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700 dark:text-blue-300">Current Debt</span>
            <span className="font-medium text-red-600 dark:text-red-400">
              ${debtNum.toFixed(4)}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t border-blue-200 dark:border-blue-800 pt-1">
            <span className="text-blue-700 dark:text-blue-300 font-semibold">Available to Borrow</span>
            <span className="font-bold text-blue-900 dark:text-blue-100">
              ${availableToBorrow.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Already has active loan warning */}
        {debtNum > 0 && (
          <div className="flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded p-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            You have an active loan of <strong className="mx-1">${debtNum.toFixed(4)} USDC</strong>.
            The protocol allows only one active loan — repay it below before borrowing again.
          </div>
        )}

        {/* Borrow Amount */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Borrow Amount (USDC)</label>
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
              onClick={() => setAmount(availableToBorrow.toFixed(4))}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Duration (Days)</label>
          <div className="grid grid-cols-5 gap-1 mb-2">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(String(d))}
                className={`py-1.5 text-xs rounded transition-all ${duration === String(d)
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <Input
            type="number"
            placeholder="Custom days"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            max="365"
          />
        </div>

        {/* Summary */}
        {amountNum > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Borrow Amount</span>
              <span className="font-medium text-gray-900 dark:text-white">${amountNum.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Est. Interest (5% APR)</span>
              <span className="font-medium text-gray-900 dark:text-white">${estimatedInterest.toFixed(4)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1">
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Total to Repay</span>
              <span className="font-bold text-gray-900 dark:text-white">${(amountNum + estimatedInterest).toFixed(4)}</span>
            </div>
          </div>
        )}

        {amountNum > availableToBorrow * 0.85 && amountNum <= availableToBorrow && amountNum > 0 && (
          <div className="flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Borrowing near your limit may put your position at liquidation risk.
          </div>
        )}

        {/* Info: single tx */}
        {amountNum > 0 && debtNum === 0 && (
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded p-2">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
            Borrowing requires 1 wallet confirmation (no approval needed — USDC is sent to you).
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Borrow Failed</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{formatError((error as any).message ?? '')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {isSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <Check className="w-4 h-4 flex-shrink-0" />
            Borrow successful! USDC has been sent to your wallet.
          </div>
        )}

        {/* Borrow Button */}
        <Button
          onClick={handleBorrow}
          disabled={
            !amount ||
            amountNum <= 0 ||
            amountNum > availableToBorrow ||
            !duration ||
            parseInt(duration) <= 0 ||
            isPending ||
            debtNum > 0
          }
          loading={isPending}
          fullWidth
          variant="primary"
        >
          {isPending ? 'Borrowing…' : debtNum > 0 ? 'Repay Active Loan First' : 'Borrow USDC'}
        </Button>

        {availableToBorrow <= 0 && debtNum === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Deposit collateral first to unlock borrowing.
          </p>
        )}

        {/* Repay Section */}
        <RepaySection debt={currentDebt} />
      </div>
    </Card>
  );
}
