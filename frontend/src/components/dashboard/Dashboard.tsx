'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { StatCard } from '../ui/Card';
import {
  useCollateralValue,
  useDebt,
  useHealthFactor,
  useLoanMode,
  useMaxBorrow,
  useBorrowerScore,
} from '@/hooks/useProtocolData';
import { Wallet, TrendingUp, Shield, AlertTriangle, Star } from 'lucide-react';
import { MultiChainCollateral } from './MultiChainCollateral';
import { AIRiskAlerts } from './AIRiskAlerts';

const MODE_STYLES: Record<string, string> = {
  Flexible: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  Conservative: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  Freeze: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
};

export function Dashboard() {
  const { isConnected } = useAccount();
  const { value: collateralValue, isLoading: collateralLoading } = useCollateralValue();
  const { debt, isLoading: debtLoading } = useDebt();
  const { healthFactor, isSafe, isLoading: healthLoading } = useHealthFactor();
  const { mode } = useLoanMode();
  const { maxBorrow, isLoading: maxLoading } = useMaxBorrow();
  const { score } = useBorrowerScore();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <Wallet className="w-16 h-16 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Connect Your Wallet</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          Connect your wallet to view your live position, health factor, and interact with the SECP Protocol on Moonbase Alpha (Polkadot).
        </p>
        <ConnectButton />
      </div>
    );
  }

  const debtNum = parseFloat(debt);
  const maxBorrowNum = parseFloat(maxBorrow);
  const availableToBorrow = Math.max(0, maxBorrowNum - debtNum);
  const utilization = maxBorrowNum > 0 ? (debtNum / maxBorrowNum) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Position</h2>
        <div className="flex items-center gap-3">
          {/* Borrower Score */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300">
            <Star className="w-4 h-4 text-yellow-400" />
            Score: <strong>{score}</strong>/100
          </div>
          {/* Mode badge */}
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${MODE_STYLES[mode] ?? MODE_STYLES.Flexible}`}>
            {mode} Mode
          </span>
        </div>
      </div>

      {/* AI Risk Alerts - New Feature */}
      <AIRiskAlerts />

      {/* Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Collateral Value"
          value={`$${parseFloat(collateralValue).toFixed(4)}`}
          subtitle="Risk-adjusted total"
          icon={<Wallet className="w-6 h-6" />}
          loading={collateralLoading}
        />

        <StatCard
          title="Current Debt"
          value={`$${debtNum.toFixed(4)}`}
          subtitle="Active USDC loan"
          icon={<TrendingUp className="w-6 h-6" />}
          loading={debtLoading}
          trend={debtNum > 0 ? 'down' : 'neutral'}
        />

        <StatCard
          title="Available to Borrow"
          value={maxLoading ? '…' : `$${availableToBorrow.toFixed(4)}`}
          subtitle={`Max: $${maxBorrowNum.toFixed(2)} (75% LTV)`}
          icon={<Shield className="w-6 h-6" />}
          loading={maxLoading}
        />

        <StatCard
          title="Health Factor"
          value={healthFactor}
          subtitle={isSafe ? '✅ Safe position' : '⚠️ At risk of liquidation'}
          icon={isSafe ? <Shield className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          loading={healthLoading}
          trend={isSafe ? 'up' : 'down'}
        />
      </div>

      {/* Multi-Chain Collateral - New Feature */}
      <MultiChainCollateral />

      {/* Utilization bar */}
      {debtNum > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Loan Utilization</span>
            <span>{utilization.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${utilization > 85 ? 'bg-red-500' : utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            <span>$0</span>
            <span>Max ${maxBorrowNum.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Liquidation warning */}
      {!isSafe && debtNum > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 dark:text-red-300 font-semibold">Warning: Low Health Factor</h3>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                Your health factor is below 1.5. Add more collateral or repay some debt to avoid automatic liquidation.
                The Anti-Liquidation system may activate to protect you.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Freeze / Conservative mode warnings */}
      {mode === 'Freeze' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded p-4 text-sm text-red-700 dark:text-red-300">
          🔴 <strong>Freeze Mode Active:</strong> Your vault has been frozen by the Anti-Liquidation system due to extreme market conditions. Withdrawals are paused and slow-repayment is underway.
        </div>
      )}
      {mode === 'Conservative' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded p-4 text-sm text-yellow-700 dark:text-yellow-300">
          🟡 <strong>Conservative Mode:</strong> Risk management is active. Consider reducing volatile asset exposure.
        </div>
      )}
    </div>
  );
}
