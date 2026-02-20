import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/Navbar';

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
            <footer className="py-6 text-center text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
              <p>SECP Protocol © 2026 · Built on Arbitrum Sepolia Testnet · Chain ID: 421614 ·{' '}
                <a href="https://sepolia.arbiscan.io" target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent-hex)' }} className="hover:underline">
                  Arbiscan Explorer
                </a>
              </p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
