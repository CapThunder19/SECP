'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import {
    useCollateralValue, useDebt, useHealthFactor,
    useLoanMode, useMaxBorrow, useBorrowerScore, useTokenBalance,
} from '@/hooks/useProtocolData';
import { CONTRACTS } from '@/config/contracts';
import {
    Card, Badge, Progress, Stagger, StaggerItem, AnimatedNumber, MotionCard,
} from '@/components/ui';
import { Wallet, TrendingUp, Shield, AlertTriangle, Star, Activity, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/* ── Skeleton ──────────────────────────── */
function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`shimmer rounded-lg ${className}`}
            style={{ background: 'var(--bg-secondary)', minHeight: 28 }} />
    );
}

/* ── Stat Card ─────────────────────────── */
function StatCard({ label, value, sub, color, loading, i }: {
    label: string; value: string; sub?: string; color?: string; loading?: boolean; i?: number;
}) {
    return (
        <MotionCard delay={i ?? 0} className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                {label}
            </p>
            {loading ? <Skeleton className="h-8 w-32 mt-1" /> : (
                <p className="text-2xl font-bold transition-colors" style={{ color: color ?? 'var(--text-primary)' }}>
                    {value}
                </p>
            )}
            {sub && !loading && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
            )}
        </MotionCard>
    );
}

/* ── Token Row ─────────────────────────── */
function TokenRow({ name, symbol, address, weight, color, i }: {
    name: string; symbol: string; address: `0x${string}`; weight: number; color: string; i: number;
}) {
    const { balance, isLoading } = useTokenBalance(address);
    return (
        <motion.div
            className="flex items-center justify-between py-3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            style={{ borderBottom: '1px solid var(--border-color)' }}
        >
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                    {symbol.slice(1, 2)}
                </div>
                <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Weight: {weight}%</p>
                </div>
            </div>
            {isLoading
                ? <Skeleton className="h-5 w-20" />
                : (
                    <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            {parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs" style={{ color }}>{symbol}</p>
                    </div>
                )}
        </motion.div>
    );
}

/* ── Mode badge ────────────────────────── */
const MODE_BADGE: Record<string, { variant: 'success' | 'warning' | 'destructive'; label: string }> = {
    Flexible: { variant: 'success', label: '🟢 Flexible' },
    Conservative: { variant: 'warning', label: '🟡 Conservative' },
    Freeze: { variant: 'destructive', label: '🔴 Freeze' },
};

export default function DashboardPage() {
    const { isConnected } = useAccount();
    const { value: collateral, isLoading: cl } = useCollateralValue();
    const { debt, isLoading: dl } = useDebt();
    const { healthFactor, rawHealthFactor, isSafe, isLoading: hl } = useHealthFactor();
    const { mode } = useLoanMode();
    const { maxBorrow, isLoading: ml } = useMaxBorrow();
    const { score } = useBorrowerScore();

    if (!isConnected) {
        return (
            <motion.div
                className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-6"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center btn-glow"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                >
                    <Wallet className="w-9 h-9 text-white" />
                </motion.div>
                <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Connect Your Wallet</h1>
                    <p className="max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        Connect to Arbitrum Sepolia to view your live position, health factor, and protocol stats.
                    </p>
                </div>
                <ConnectButton />
            </motion.div>
        );
    }

    const colN = parseFloat(collateral);
    const debtN = parseFloat(debt);
    const maxN = parseFloat(maxBorrow);
    const avail = Math.max(0, maxN - debtN);
    const util = maxN > 0 ? Math.min((debtN / maxN) * 100, 100) : 0;

    const hfColor = rawHealthFactor >= 150 ? '#22c55e' : rawHealthFactor >= 100 ? '#f59e0b' : '#ef4444';
    const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
    const modeBadge = MODE_BADGE[mode] ?? MODE_BADGE.Flexible;

    return (
        <div className="space-y-8">

            {/* Header */}
            <motion.div
                className="flex items-center justify-between flex-wrap gap-3"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Your live position on Arbitrum Sepolia</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="success">
                        <Activity className="w-3 h-3" /> Live
                    </Badge>
                    <Badge variant={modeBadge.variant}>{modeBadge.label} Mode</Badge>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Collateral Value" value={`$${colN.toFixed(4)}`} sub="Risk-adjusted" loading={cl} i={0} />
                <StatCard label="Current Debt" value={`$${debtN.toFixed(4)}`} sub="Active USDC loan" loading={dl} i={1}
                    color={debtN > 0 ? '#ef4444' : '#22c55e'} />
                <StatCard label="Available to Borrow" value={`$${avail.toFixed(4)}`} sub={`Max $${maxN.toFixed(2)}`} loading={ml} i={2} />
                <StatCard label="Health Factor" value={healthFactor} sub={isSafe ? 'Safe ✅' : 'At risk ⚠️'} loading={hl} i={3}
                    color={hfColor} />
            </div>

            {/* Utilization + Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <MotionCard delay={4} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <TrendingUp className="w-4 h-4 text-indigo-400" /> Loan Utilization
                        </h3>
                        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                            <AnimatedNumber value={util} suffix="%" decimals={1} />
                        </span>
                    </div>
                    <Progress value={util}
                        indicatorClassName={util > 80 ? 'bg-red-500' : util > 60 ? 'bg-yellow-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'} />
                    <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>$0</span><span>Max ${maxN.toFixed(2)}</span>
                    </div>
                    {debtN <= 0 && (
                        <Link href="/deposit" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> Deposit collateral to start borrowing
                        </Link>
                    )}
                </MotionCard>

                <MotionCard delay={5} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Star className="w-4 h-4 text-yellow-400" /> Borrower Score
                        </h3>
                        <span className="text-lg font-bold" style={{ color: scoreColor }}>
                            <AnimatedNumber value={score} suffix="/100" decimals={0} />
                        </span>
                    </div>
                    <Progress value={score}
                        indicatorClassName={score >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'} />
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {score >= 80 ? '🟢 Reliable borrower — eligible for Flexible mode'
                            : score >= 60 ? '🟡 Moderate — repay on time to improve'
                                : '🔴 Low score — late repayments or liquidations detected'}
                    </p>
                </MotionCard>
            </div>

            {/* Token balances */}
            <MotionCard delay={6} className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Wallet className="w-4 h-4 text-indigo-400" /> Wallet Token Balances
                    </h3>
                    <Link href="/faucet" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Get more tokens
                    </Link>
                </div>
                <TokenRow name="Mock USDC" symbol="mUSDC" address={CONTRACTS.mockUSDC as `0x${string}`} weight={90} color="#22c55e" i={0} />
                <TokenRow name="Mock Yield" symbol="mYLD" address={CONTRACTS.mockYield as `0x${string}`} weight={80} color="#f59e0b" i={1} />
                <TokenRow name="Mock RWA" symbol="mRWA" address={CONTRACTS.mockRWA as `0x${string}`} weight={100} color="#6366f1" i={2} />
            </MotionCard>

            {/* Alerts */}
            {!isSafe && debtN > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl p-5 flex items-start gap-4"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-300">Low Health Factor — Liquidation Risk</p>
                        <p className="text-sm mt-1 text-red-400/80">
                            Add more collateral or repay debt. Anti-Liquidation system may activate soon.
                        </p>
                        <div className="flex gap-3 mt-3">
                            <Link href="/deposit" className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                                style={{ background: 'rgba(239,68,68,0.35)' }}>Add Collateral</Link>
                            <Link href="/borrow" className="text-xs font-semibold px-3 py-1.5 rounded-lg text-red-300"
                                style={{ background: 'rgba(239,68,68,0.15)' }}>Repay Debt</Link>
                        </div>
                    </div>
                </motion.div>
            )}
            {mode === 'Freeze' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-xl p-5"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <p className="font-semibold text-red-300">🔴 Freeze Mode Active</p>
                    <p className="text-sm text-red-400/80 mt-1">Your vault is frozen. Withdrawals paused. Slow-repayment is running.</p>
                </motion.div>
            )}
            {mode === 'Conservative' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-xl p-5"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <p className="font-semibold text-yellow-300">🟡 Conservative Mode</p>
                    <p className="text-sm text-yellow-400/80 mt-1">Risk management active. Consider reducing volatile asset exposure.</p>
                </motion.div>
            )}

            {/* Quick actions */}
            <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { href: '/deposit', label: '↓ Deposit Collateral', color: '#6366f1' },
                    { href: '/borrow', label: '↗ Borrow / Repay', color: '#22c55e' },
                    { href: '/faucet', label: '🚰 Get Test Tokens', color: '#8b5cf6' },
                ].map(({ href, label, color }) => (
                    <StaggerItem key={href}>
                        <Link href={href}>
                            <motion.div
                                className="glass-card p-4 text-center font-semibold text-sm"
                                style={{ color }}
                                whileHover={{ y: -3, boxShadow: `0 8px 24px ${color}20` }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {label}
                            </motion.div>
                        </Link>
                    </StaggerItem>
                ))}
            </Stagger>
        </div>
    );
}
