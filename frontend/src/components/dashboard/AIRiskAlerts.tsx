'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { AlertTriangle, Shield, TrendingUp, Brain, CheckCircle } from 'lucide-react';

export enum RiskLevel {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

interface RiskAlert {
  level: RiskLevel;
  message: string;
  recommendation: string;
  timestamp: Date;
  autoProtectEnabled?: boolean;
}

const RISK_LEVEL_CONFIG = {
  [RiskLevel.Low]: {
    color: "green",
    icon: <CheckCircle className="w-5 h-5" />,
    bgLight: "bg-green-50 dark:bg-green-900/20",
    borderLight: "border-green-200 dark:border-green-800",
    textLight: "text-green-800 dark:text-green-200",
  },
  [RiskLevel.Medium]: {
    color: "yellow",
    icon: <Shield className="w-5 h-5" />,
    bgLight: "bg-yellow-50 dark:bg-yellow-900/20",
    borderLight: "border-yellow-200 dark:border-yellow-800",
    textLight: "text-yellow-800 dark:text-yellow-200",
  },
  [RiskLevel.High]: {
    color: "orange",
    icon: <TrendingUp className="w-5 h-5" />,
    bgLight: "bg-orange-50 dark:bg-orange-900/20",
    borderLight: "border-orange-200 dark:border-orange-800",
    textLight: "text-orange-800 dark:text-orange-200",
  },
  [RiskLevel.Critical]: {
    color: "red",
    icon: <AlertTriangle className="w-5 h-5" />,
    bgLight: "bg-red-50 dark:bg-red-900/20",
    borderLight: "border-red-200 dark:border-red-800",
    textLight: "text-red-800 dark:text-red-200",
  },
};

export function AIRiskAlerts() {
  const { address, isConnected } = useAccount();
  const [currentRisk, setCurrentRisk] = useState<RiskAlert | null>(null);
  const [autoProtect, setAutoProtect] = useState(false);
  const [marketVolatility, setMarketVolatility] = useState(45); // Mock data
  const [diversificationScore, setDiversificationScore] = useState(65); // Mock data

  useEffect(() => {
    if (!isConnected) return;

    // Mock risk prediction - in production, this would call the AI contract
    const mockRiskPrediction = (): RiskAlert => {
      const riskScore = Math.floor(Math.random() * 100);
      
      if (riskScore < 30) {
        return {
          level: RiskLevel.Low,
          message: "Your position is safe",
          recommendation: "Continue normal operations. Consider increasing leverage if desired.",
          timestamp: new Date(),
          autoProtectEnabled: autoProtect,
        };
      } else if (riskScore < 60) {
        return {
          level: RiskLevel.Medium,
          message: "Moderate market volatility detected",
          recommendation: "Monitor your health factor closely. Consider diversifying across chains.",
          timestamp: new Date(),
          autoProtectEnabled: autoProtect,
        };
      } else if (riskScore < 80) {
        return {
          level: RiskLevel.High,
          message: "High risk detected - action recommended",
          recommendation: "Add collateral or reduce debt. Enable auto-protection for safety.",
          timestamp: new Date(),
          autoProtectEnabled: autoProtect,
        };
      } else {
        return {
          level: RiskLevel.Critical,
          message: "CRITICAL: Liquidation risk imminent",
          recommendation: "Immediate action required! Add collateral now or repay debt.",
          timestamp: new Date(),
          autoProtectEnabled: autoProtect,
        };
      }
    };

    // Update risk every 10 seconds (in production, this would be event-driven)
    const interval = setInterval(() => {
      setCurrentRisk(mockRiskPrediction());
    }, 10000);

    // Initial prediction
    setCurrentRisk(mockRiskPrediction());

    return () => clearInterval(interval);
  }, [isConnected, autoProtect]);

  if (!isConnected || !currentRisk) {
    return null;
  }

  const config = RISK_LEVEL_CONFIG[currentRisk.level];

  return (
    <div className="space-y-4">
      {/* Main Risk Alert */}
      <div className={`${config.bgLight} ${config.borderLight} border-2 rounded-lg p-5`}>
        <div className="flex items-start gap-4">
          <div className={config.textLight}>{config.icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-bold ${config.textLight}`}>
                AI Risk Assessment
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${config.bgLight} ${config.textLight} font-semibold`}>
                {RiskLevel[currentRisk.level]}
              </span>
            </div>
            <p className={`text-sm font-medium ${config.textLight} mb-2`}>
              {currentRisk.message}
            </p>
            <p className={`text-xs ${config.textLight} opacity-90`}>
              💡 {currentRisk.recommendation}
            </p>
          </div>
        </div>

        {/* Auto-Protection Toggle */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI Auto-Protection
              </span>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={autoProtect}
                onChange={(e) => setAutoProtect(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`block w-10 h-6 rounded-full transition-colors ${
                  autoProtect ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                onClick={() => setAutoProtect(!autoProtect)}
              >
                <div
                  className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    autoProtect ? 'transform translate-x-4' : ''
                  }`}
                />
              </div>
            </div>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Automatically trigger protection when high risk is detected
          </p>
        </div>
      </div>

      {/* Market Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          title="Market Volatility"
          value={`${marketVolatility}%`}
          subtitle="Current market conditions"
          color={marketVolatility > 60 ? 'red' : marketVolatility > 40 ? 'yellow' : 'green'}
        />
        <MetricCard
          title="Diversification"
          value={`${diversificationScore}%`}
          subtitle="Portfolio distribution"
          color={diversificationScore < 40 ? 'red' : diversificationScore < 60 ? 'yellow' : 'green'}
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: 'green' | 'yellow' | 'red';
}

function MetricCard({ title, value, subtitle, color }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4`}>
      <p className="text-xs font-medium opacity-80 mb-1">{title}</p>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs opacity-70">{subtitle}</p>
    </div>
  );
}
