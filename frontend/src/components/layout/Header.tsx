'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                SECP Protocol
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Arbitrum Sepolia
              </p>
            </div>
          </div>

          {/* Connect Button */}
          <div className="flex items-center space-x-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
