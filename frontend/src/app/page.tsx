'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, BarChart2, Lock, RefreshCw, TrendingDown } from 'lucide-react';
import { Stagger, StaggerItem, Badge, MotionCard } from '@/components/ui';

const stats = [
  { label: 'Total Value Locked', value: '$2.1M+', sub: 'Testnet demo' },
  { label: 'Active Borrowers', value: '340+', sub: 'On Arbitrum Sepolia' },
  { label: 'Anti-Liquidations', value: '58', sub: 'Positions auto-protected' },
  { label: 'Avg. Health Factor', value: '2.41×', sub: 'Above safe threshold' },
];

const features = [
  { icon: Shield, color: '#6366f1', title: 'Anti-Liquidation AI', desc: 'Instead of instantly liquidating, SECP automatically switches vault modes and uses yield earnings to repay debt slowly.' },
  { icon: BarChart2, color: '#22c55e', title: 'Multi-Asset Collateral', desc: 'Deposit USDC, Yield tokens, and RWA tokens as collateral. Each asset has a risk weight that determines your borrowing power.' },
  { icon: Zap, color: '#f59e0b', title: 'Borrower Memory', desc: 'The protocol tracks your repayment history. Reliable borrowers are rewarded with Flexible mode and higher LTV ratios.' },
  { icon: Lock, color: '#ec4899', title: 'Vault Modes', desc: 'Flexible → Conservative → Freeze. The vault mode adjusts automatically based on market volatility and your health factor.' },
  { icon: RefreshCw, color: '#06b6d4', title: 'Yield Diversion', desc: 'When in Freeze mode, yield earnings are automatically rerouted to repay your loan — protecting your collateral.' },
  { icon: TrendingDown, color: '#8b5cf6', title: 'Market Simulation', desc: 'Simulate a market crash to see exactly how SECP\'s protection system responds — step by step in real time.' },
];

const collateral = [
  { sym: 'mUSDC', name: 'Mock USDC', price: '$1.00', weight: '90%', color: '#22c55e', desc: 'Stable, low-risk collateral' },
  { sym: 'mYLD', name: 'Mock Yield', price: '$1.05', weight: '80%', color: '#f59e0b', desc: 'Yield-bearing asset' },
  { sym: 'mRWA', name: 'Mock RWA', price: '$1.50', weight: '100%', color: '#6366f1', desc: 'Real-World Asset (safest)' },
];

const steps = [
  { n: '01', title: 'Get Test Tokens', desc: 'Visit the Faucet page and claim 1,000 mUSDC, mYLD, and mRWA tokens for free.', href: '/faucet', cta: 'Go to Faucet' },
  { n: '02', title: 'Deposit Collateral', desc: 'Deposit your tokens into the SmartVault. Your collateral value determines your max borrow.', href: '/deposit', cta: 'Deposit' },
  { n: '03', title: 'Borrow USDC', desc: 'Borrow USDC against your collateral at up to 75% LTV with a flexible or fixed duration.', href: '/borrow', cta: 'Borrow' },
  { n: '04', title: 'Crash the Market', desc: 'Try the Market Simulator to see how SECP automatically protects your position during a crash.', href: '/market', cta: 'Simulate' },
];

export default function HomePage() {
  return (
    <div className="space-y-24">

      {/* ── Hero ──────────────────────────────── */}
      <section className="text-center pt-10 pb-4 relative">
        {/* Glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, #6366f1 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.28, 0.18] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <Badge variant="default" className="mb-6 text-xs px-4 py-1.5">
            <span className="pulse-dot" /> Live on Arbitrum Sepolia Testnet
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight"
            style={{ color: 'var(--text-primary)' }}>
            DeFi Lending,{' '}
            <span className="gradient-text">Reimagined</span>
          </h1>

          <p className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Deposit multi-asset collateral, borrow USDC, and let the protocol automatically
            protect your position during market volatility — no liquidation panic.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <motion.div
                className="btn-glow inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold text-base"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Launch App <ArrowRight className="w-4 h-4" />
              </motion.div>
            </Link>
            <Link href="/market">
              <motion.div
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
                whileHover={{ scale: 1.03, color: 'var(--text-primary)' }}
                whileTap={{ scale: 0.97 }}
              >
                <TrendingDown className="w-4 h-4" /> Simulate Market Crash
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Stats ─────────────────────────────── */}
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <MotionCard className="p-6 text-center">
              <p className="text-2xl md:text-3xl font-black gradient-text">{s.value}</p>
              <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
            </MotionCard>
          </StaggerItem>
        ))}
      </Stagger>

      {/* ── How it works ──────────────────────── */}
      <section>
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Get Started in 4 Steps
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>No experience needed — try the full protocol in under 5 minutes.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <MotionCard className="p-5 h-full flex flex-col">
                <div className="text-4xl font-black mb-3 gradient-text opacity-60">{s.n}</div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                <Link href={s.href} className="mt-4">
                  <motion.div
                    className="text-xs font-semibold text-indigo-400 flex items-center gap-1"
                    whileHover={{ x: 4 }}
                  >
                    {s.cta} <ArrowRight className="w-3 h-3" />
                  </motion.div>
                </Link>
              </MotionCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────── */}
      <section>
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            What Makes SECP Different
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Smart protection built in — not bolted on.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <MotionCard className="p-6 h-full">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </MotionCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Collateral table ──────────────────── */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <MotionCard className="overflow-hidden">
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Collateral Parameters</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                All tokens available as collateral on Arbitrum Sepolia
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    {['Token', 'Name', 'Oracle Price', 'Risk Weight', 'Max LTV', 'Use Case'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {collateral.map((c, i) => (
                    <motion.tr
                      key={c.sym}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                          style={{ background: `${c.color}15`, color: c.color }}>
                          {c.sym.slice(1, 2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{c.sym}</td>
                      <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{c.price}</td>
                      <td className="px-6 py-4">
                        <Badge variant={c.weight === '100%' ? 'success' : c.weight === '80%' ? 'warning' : 'default'}>
                          {c.weight}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-semibold" style={{ color: 'var(--text-primary)' }}>75%</td>
                      <td className="px-6 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{c.desc}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MotionCard>
        </motion.div>
      </section>

      {/* ── CTA ───────────────────────────────── */}
      <section>
        <motion.div
          className="rounded-2xl p-12 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <h2 className="text-3xl font-bold mb-3 relative" style={{ color: 'var(--text-primary)' }}>
            Ready to Try?
          </h2>
          <p className="mb-8 relative" style={{ color: 'var(--text-secondary)' }}>
            No real money needed — everything runs on Arbitrum Sepolia testnet.
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative">
            <Link href="/faucet">
              <motion.div className="btn-glow px-8 py-3.5 rounded-xl text-white font-semibold text-sm inline-flex gap-2"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                Get Free Test Tokens
              </motion.div>
            </Link>
            <Link href="/market">
              <motion.div
                className="px-8 py-3.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <TrendingDown className="w-4 h-4" /> Crash Demo
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
