'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Shield, Zap, BarChart2, Lock, RefreshCw, TrendingDown,
  Users, Database, ShieldCheck, Activity, Hexagon
} from 'lucide-react';
import { Stagger, StaggerItem, Badge, Button } from '@/components/ui';

const stats = [
  { label: 'Total Value Locked', value: '$2.1M+', sub: 'Testnet demo', icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Active Borrowers', value: '340+', sub: 'On Moonbase Alpha', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: 'Anti-Liquidations', value: '58', sub: 'Positions auto-protected', icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Avg. Health Factor', value: '2.41×', sub: 'Above safe threshold', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

const features = [
  { icon: Shield, color: '#6366f1', title: 'Anti-Liquidation AI', desc: 'Instead of instantly liquidating, SECP automatically switches vault modes and uses yield earnings to repay debt slowly.' },
  { icon: BarChart2, color: '#22c55e', title: 'Multi-Asset Collateral', desc: 'Deposit DOT, WBTC, RWA, and Yield tokens as collateral via XCM from multiple chains. Each asset has a risk weight.' },
  { icon: Zap, color: '#f59e0b', title: 'Borrower Memory', desc: 'The protocol tracks your repayment history. Reliable borrowers are rewarded with Flexible mode and higher LTV ratios.' },
  { icon: Lock, color: '#ec4899', title: 'Vault Modes', desc: 'Flexible → Conservative → Freeze. The vault mode adjusts automatically based on market volatility and your health factor.' },
  { icon: RefreshCw, color: '#06b6d4', title: 'Yield Diversion', desc: 'When in Freeze mode, yield earnings are automatically rerouted to repay your loan — protecting your collateral.' },
  { icon: TrendingDown, color: '#8b5cf6', title: 'Cross-Chain XCM', desc: 'Deposit collateral from Polkadot Hub, Moonbeam, Acala, Astar, or Arbitrum. All chains, one unified vault.' },
];

const collateral = [
  { sym: 'mDOT', name: 'Mock DOT', price: '$6.00', weight: '85%', color: '#e91e8c', desc: 'Polkadot native token' },
  { sym: 'mWBTC', name: 'Mock WBTC', price: '$65,000', weight: '90%', color: '#f7931a', desc: 'Wrapped Bitcoin' },
  { sym: 'mRWA', name: 'Mock RWA', price: '$1.50', weight: '80%', color: '#6366f1', desc: 'Real-World Asset' },
  { sym: 'mYLD', name: 'Mock Yield', price: '$1.05', weight: '75%', color: '#f59e0b', desc: 'Yield-bearing token' },
];

const steps = [
  { n: '01', title: 'Get Test Tokens', desc: 'Visit the Faucet page and claim mDOT, mWBTC, mUSDC, mRWA, and mYLD tokens for free.', href: '/faucet', cta: 'Go to Faucet' },
  { n: '02', title: 'Deposit Collateral', desc: 'Deposit your tokens (DOT, WBTC, RWA, or Yield) into the SmartVault. Your collateral value determines your max borrow.', href: '/deposit', cta: 'Deposit' },
  { n: '03', title: 'Borrow USDC', desc: 'Borrow USDC against your collateral at up to 75% LTV with a flexible or fixed duration.', href: '/borrow', cta: 'Borrow' },
  { n: '04', title: 'Crash the Market', desc: 'Try the Market Simulator to see how SECP automatically protects your position during a crash.', href: '/market', cta: 'Simulate' },
];

export default function HomePage() {
  return (
    <div className="space-y-24">
      {/* ── Global Background decoration ────────── */}
      <div className="fixed inset-0 pointer-events-none -z-10" style={{ background: 'var(--bg-warm)' }}>
        <div className="absolute top-0 right-0 w-[60%] h-[50%] bg-primary/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[40%] bg-[#ffd0e8]/10 blur-[120px] rounded-full" />
      </div>

      {/* ── Hero ──────────────────────────────── */}
      <section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] border-b-2 backdrop-blur-sm pb-12 min-h-[90vh] flex items-center overflow-hidden" style={{ borderColor: 'var(--border-strong)', background: 'color-mix(in srgb, var(--surface) 30%, transparent)' }}>
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="lg:col-span-7 text-left z-20"
            >
              <div className="flex justify-start mb-6">
                <Badge variant="conf" className="px-6 py-2 tracking-[0.2em] bg-[#ffd0e8] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase font-black text-[10px] rounded-full">
                  Protocol Overview v1.0
                </Badge>
              </div>

              <h1 className="text-3xl md:text-7xl lg:text-[6.5rem] font-black mb-8 tracking-tighter text-foreground uppercase">
                DEFI&nbsp;&nbsp;LENDING<br />
                <span className="text-primary ">REIMAGINED</span>
              </h1>

              <p className="text-xl max-w-2xl mb-12 leading-relaxed font-normal italic" style={{ color: 'var(--text-secondary)' }}>
                Deposit multi-asset collateral, borrow USDC, and let the protocol automatically protect your position during market volatility — <span className="font-bold not-italic" style={{ color: 'hsl(var(--foreground))' }}>no liquidation panic.</span>
              </p>

              <div className="flex flex-wrap items-center gap-6">
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-full px-12 h-16 transition-all font-black text-sm tracking-widest border-2 shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(var(--ink-rgb),1)]" style={{ background: 'var(--ink)', color: 'var(--surface)', borderColor: 'var(--border-strong)' }}>
                    LAUNCH APP <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/market">
                  <Button size="lg" variant="outline" className="rounded-full px-10 h-16 font-black text-sm tracking-widest border-2 transition-all shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(var(--ink-rgb),1)]" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}>
                    <TrendingDown className="w-5 h-5 mr-2" /> SIMULATE CRASH
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right Side: Visual Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2 }}
              className="lg:col-span-5 relative hidden lg:flex items-center justify-center p-8"
            >
              <div className="relative w-full aspect-square max-w-[480px]">
                {/* Orbital Rings */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ rotate: 360 * (i % 2 === 0 ? 1 : -1) }}
                    transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-black/10 rounded-full"
                    style={{ transform: `scale(${1 + i * 0.2}) rotateX(60deg)` }}
                  />
                ))}

                {/* Central Vault Engine */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-64 h-80 border-[3px] rounded-[3rem] p-8 flex flex-col justify-between relative z-20" style={{ background: 'hsl(var(--card))', borderColor: 'var(--border-strong)', boxShadow: '16px 16px 0px 0px rgba(var(--ink-rgb), 1)' }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,208,232,1)]" style={{ background: 'var(--ink)' }}>
                        <Shield className="w-8 h-8" style={{ color: 'var(--surface)' }} />
                      </div>
                      <Badge variant="success" className="bg-green-100 text-green-700 border-2 border-green-300 px-4 py-1 font-black text-[10px]">SECURE</Badge>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-3xl font-black leading-tight uppercase italic decoration-primary underline underline-offset-4">VAULT<br />ENGINE</h3>
                      <div className="h-3 w-full rounded-full overflow-hidden border-2" style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border) / 0.1)' }}>
                        <motion.div
                          animate={{ width: ["10%", "90%", "65%"] }}
                          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t-2 flex justify-between items-center" style={{ borderColor: 'hsl(var(--border) / 0.1)' }}>
                      <div>
                        <p className="text-[10px] font-black uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Locked TVL</p>
                        <p className="text-2xl font-black font-outfit">$2.14M</p>
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-2 border-black rounded-full flex items-center justify-center bg-[#ffd0e8] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <RefreshCw className="w-6 h-6" />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Orbs */}
                {[
                  { icon: Database, color: "bg-blue-500", pos: "top-0 left-1/4" },
                  { icon: Zap, color: "bg-amber-500", pos: "bottom-0 right-1/4" },
                  { icon: Hexagon, color: "bg-purple-500", pos: "top-1/3 right-0" },
                ].map((orb, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                    className={`absolute ${orb.pos} w-16 h-16 ${orb.color} text-white border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center z-30`}
                  >
                    <orb.icon className="w-8 h-8" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────── */}
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-12 py-12">
        {stats.map((s) => (
          <StaggerItem key={s.label} className="flex flex-col items-center text-center">
            <div className={`w-20 h-20 mb-6 flex items-center justify-center rounded-3xl ${s.bg} border-2`} style={{ borderColor: 'hsl(var(--border) / 0.05)' }}>
              <s.icon className={`w-10 h-10 ${s.color}`} strokeWidth={2.5} />
            </div>
            <p className="text-5xl font-black mb-2 tracking-tighter uppercase" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
            <p className="text-[10px] mt-1 font-medium italic" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{s.sub}</p>
          </StaggerItem>
        ))}
      </Stagger>

      {/* ── How it works ──────────────────────── */}
      <section className="py-12">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-secondary)' }}>Getting Started</p>
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase">
            The SECP Workflow
          </h2>
          <p className="font-medium max-w-lg mx-auto italic" style={{ color: 'var(--text-secondary)' }}>No experience needed — try the full protocol in under 5 minutes.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex"
            >
              <div className="flex-1 flex flex-col group border-2 rounded-2xl overflow-hidden transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--card))', boxShadow: '4px 4px 0px 0px rgba(var(--ink-rgb),1)' }}>
                <div className="p-8 flex-1">
                  <div className="flex items-center justify-between mb-8">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${i % 3 === 0 ? 'bg-[#d0e8ff]' : i % 3 === 1 ? 'bg-[#ffe8d0]' : 'bg-[#ffd0e8]'
                      }`}>
                      {i % 3 === 0 ? 'Step' : i % 3 === 1 ? 'Action' : 'Goal'} {s.n.slice(1)}
                    </div>
                    <div className="w-10 h-10 border-2 rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(var(--ink-rgb),1)] group-hover:rotate-12 transition-transform" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}>
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black mb-4 tracking-tight uppercase leading-none">{s.title}</h3>
                  <p className="text-sm font-normal leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                </div>
                <Link href={s.href}>
                  <div className="p-5 border-t-2 border-black bg-[#F3DFC1] hover:bg-[#ebd2b0] transition-all flex items-center justify-between font-black text-xs tracking-widest uppercase cursor-pointer text-black">
                    {s.cta} <ArrowUpRight className="w-4 h-4" />
                  </div>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────── */}
      <section className="py-12 bg-black -mx-4 px-4 py-24 text-white rounded-[3rem]">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-neutral-400">Architecture</p>
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-white uppercase italic">
            Engineered Safety
          </h2>
          <p className="font-normal text-neutral-400 italic">Smart protection built in — not bolted on.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <div className="p-8 border-2 border-neutral-800 rounded-3xl bg-neutral-900/40 hover:border-white/20 transition-all group">
                <div className={`w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center mb-6 transition-all bg-white/5`}>
                  <f.icon className="w-6 h-6" strokeWidth={2.5} style={{ color: f.color }} />
                </div>
                <h3 className="text-lg font-black mb-3 tracking-tight uppercase text-white italic">{f.title}</h3>
                <p className="text-sm font-normal leading-relaxed text-neutral-400">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Collateral table ──────────────────── */}
      <section className="py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-12 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-secondary)' }}>Risk Assessment</p>
            <h2 className="text-4xl font-black tracking-tight uppercase italic decoration-primary underline underline-offset-4">System Parameters</h2>
          </div>

          <div className="border-2 rounded-3xl overflow-hidden" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--card))', boxShadow: '8px 8px 0px 0px rgba(var(--ink-rgb),1)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--muted))' }}>
                    {['Token', 'Name', 'Oracle Price', 'Sim Weight', 'Max LTV', 'Use Case'].map(h => (
                      <th key={h} className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'hsl(var(--foreground))' }}>{h}</th>
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
                      className="group border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.1)' } as React.CSSProperties}
                    >
                      <td className="px-8 py-6">
                        <div className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white"
                          style={{ background: c.color }}>
                          {c.sym.slice(1, 2)}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black uppercase tracking-tight">{c.sym}</td>
                      <td className="px-8 py-6 font-medium" style={{ color: 'var(--text-secondary)' }}>{c.price}</td>
                      <td className="px-8 py-6">
                        <Badge variant={c.weight === '100%' ? 'success' : c.weight === '80%' ? 'warning' : 'default'} className="px-4">
                          {c.weight}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 font-black" style={{ color: 'hsl(var(--foreground))' }}>75%</td>
                      <td className="px-8 py-6 text-xs font-medium italic" style={{ color: 'var(--text-secondary)' }}>{c.desc}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── CTA ───────────────────────────────── */}
      <section className="pb-24">
        <motion.div
          className="rounded-[2.5rem] p-16 text-center relative overflow-hidden border-2 shadow-[8px_8px_0px_0px_rgba(var(--ink-rgb),1)]" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'hsl(var(--muted) / 0.3)' }} />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground uppercase tracking-tight italic">
              Ready to Secure Your Yield?
            </h2>
            <p className="text-lg mb-12 font-normal max-w-xl mx-auto italic" style={{ color: 'var(--text-secondary)' }}>
              Join the future of DeFi lending on Polkadot. No real money needed — everything runs on Moonbase Alpha testnet with free DEV tokens.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/faucet">
                <Button size="lg" className="rounded-full px-12 h-14 transition-all font-extrabold text-sm tracking-widest border-2 shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),1)] hover:translate-x-[-2px] hover:translate-y-[-2px]" style={{ background: 'var(--ink)', color: 'var(--surface)', borderColor: 'var(--border-strong)' }}>
                  GET TEST TOKENS <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
