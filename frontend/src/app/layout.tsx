import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/Navbar';
import { Shield } from 'lucide-react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'SECP Protocol — DeFi Lending Reimagined', template: '%s | SECP Protocol' },
  description: 'Deposit multi-asset collateral, borrow USDC, and let the protocol automatically protect your position during market volatility.',
  keywords: ['DeFi', 'lending', 'USDC', 'collateral', 'Arbitrum', 'anti-liquidation'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>
          <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
              {children}
            </main>
            <footer className="py-12 border-t-2 border-black bg-[var(--bg-warm-footer)]/40 -mx-4 px-4 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 font-black text-sm tracking-tighter uppercase">
                  <Shield className="w-5 h-5" /> SECP PROTOCOL
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                  Built on Arbitrum Sepolia Testnet · Chain ID: 421614
                </p>
                <a href="https://sepolia.arbiscan.io" target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-black uppercase tracking-widest border-2 border-black rounded-lg px-4 py-2 hover:bg-black hover:text-white transition-all">
                  Arbiscan Explorer
                </a>
                <p className="text-[10px] font-medium text-neutral-400 mt-4 italic">
                  SECP Protocol © 2026 · Anti-Liquidation Reimagined
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
