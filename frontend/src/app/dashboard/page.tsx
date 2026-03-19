'use client';

import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    useCollateralValue, useDebt, useHealthFactor,
    useLoanMode, useMaxBorrow, useBorrowerScore, useTokenBalance,
} from '@/hooks/useProtocolData';
import { getContractsForChain } from '@/config/contracts';
import {
    Card, Badge, Progress, Stagger, StaggerItem, AnimatedNumber, MotionCard, Button,
} from '@/components/ui';
import { Wallet, TrendingUp, Shield, AlertTriangle, Star, Activity, RefreshCw, ArrowRight, TrendingDown, X } from 'lucide-react';
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
        <div className="p-8 border-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),1)] hover:-translate-y-1 transition-transform group" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 group-hover:opacity-100 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                {label}
            </p>
            {loading ? <Skeleton className="h-10 w-32 mt-1" /> : (
                <p className="text-4xl font-extrabold tracking-tighter" style={{ color: color ?? 'hsl(var(--foreground))' }}>
                    {value}
                </p>
            )}
            {sub && !loading && (
                <p className="text-[10px] mt-2 font-black uppercase tracking-widest italic" style={{ color: 'var(--text-secondary)' }}>{sub}</p>
            )}
        </div>
    );
}

/* ── Token Row ─────────────────────────── */
function TokenRow({ name, symbol, address, weight, color, i }: {
    name: string; symbol: string; address: `0x${string}`; weight: number; color: string; i: number;
}) {
    const { balance, isLoading } = useTokenBalance(address);
    return (
        <motion.div
            className="flex items-center justify-between py-6 group"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            style={{ borderBottom: '1.5px solid var(--border-strong)' }}
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 border-2 rounded-xl flex items-center justify-center text-sm font-black shadow-[2px_2px_0px_0px_rgba(var(--ink-rgb),1)] transition-all text-white"
                    style={{ background: color, borderColor: 'var(--border-strong)' }}>
                    {symbol.slice(1, 2)}
                </div>
                <div>
                    <p className="text-base font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>{name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Weight: {weight}%</p>
                </div>
            </div>
            {isLoading
                ? <Skeleton className="h-6 w-24" />
                : (
                    <div className="text-right">
                        <p className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] font-black uppercase" style={{ color: 'var(--text-secondary)' }}>{symbol}</p>
                    </div>
                )}
        </motion.div>
    );
}

const MODE_BADGE: Record<string, { variant: 'success' | 'warning' | 'destructive'; label: string }> = {
    Flexible: { variant: 'success', label: '🟢 Flexible' },
    Conservative: { variant: 'warning', label: '🟡 Conservative' },
    Freeze: { variant: 'destructive', label: '🔴 Freeze' },
};

/* ── Crash Result Interface ──────────────────────────── */
interface CrashResult {
    timestamp: number;
    intensity: number;
    collateralBefore: number;
    collateralAfter: number;
    healthFactorBefore: number;
    healthFactorAfter: number;
    tokens: Record<string, number>;
}

/* ── Crash Result Card ──────────────────────────── */
function CrashResultCard({ result, onDismiss }: { result: CrashResult; onDismiss: () => void }) {
    const timeSince = Math.floor((Date.now() - result.timestamp) / 1000 / 60); // minutes ago
    const timeText = timeSince < 1 ? 'Just now' : timeSince < 60 ? `${timeSince}m ago` : `${Math.floor(timeSince / 60)}h ago`;
    
    const colLoss = result.collateralBefore - result.collateralAfter;
    const colLossPct = result.collateralBefore > 0 ? (colLoss / result.collateralBefore) * 100 : 0;
    const hfDrop = result.healthFactorBefore - result.healthFactorAfter;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="p-6 border-2 shadow-[6px_6px_0px_0px_rgba(239,68,68,0.3)] relative" 
                style={{ borderColor: '#ef4444', background: 'linear-gradient(to bottom right, hsl(var(--card)), rgba(239,68,68,0.05))' }}>
                {/* Dismiss button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center hover:bg-red-100 transition-colors"
                    style={{ borderColor: 'var(--border-strong)' }}
                >
                    <X className="w-3 h-3" />
                </button>
                
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),1)]" 
                        style={{ background: '#ef4444', borderColor: 'var(--border-strong)' }}>
                        <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-black uppercase tracking-tight">Recent Market Crash</h3>
                            <Badge variant="destructive" className="text-[9px] font-black uppercase">
                                −{result.intensity}% SIMULATED
                            </Badge>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                            {timeText} • Protocol protection activated
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 rounded-xl border-2" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--muted))' }}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Collateral Impact</p>
                        <p className="text-2xl font-black text-red-600">${result.collateralAfter.toFixed(2)}</p>
                        <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--text-secondary)' }}>
                            −${colLoss.toFixed(2)} ({colLossPct.toFixed(1)}%)
                        </p>
                    </div>
                    
                    <div className="p-4 rounded-xl border-2" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--muted))' }}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Health Factor</p>
                        <p className={`text-2xl font-black ${result.healthFactorAfter < 100 ? 'text-red-600' : result.healthFactorAfter < 150 ? 'text-amber-600' : ''}`}>
                            {result.healthFactorAfter === Infinity ? '∞' : result.healthFactorAfter.toFixed(0)}
                        </p>
                        <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {hfDrop === Infinity ? 'From ∞' : `−${hfDrop.toFixed(0)} from ${result.healthFactorBefore === Infinity ? '∞' : result.healthFactorBefore.toFixed(0)}`}
                        </p>
                    </div>
                </div>
                
                <div className="mt-6 p-4 rounded-xl border-2 flex items-start gap-3" 
                    style={{ borderColor: 'hsl(var(--border) / 0.1)', background: 'rgba(99,102,241,0.05)' }}>
                    <Shield className="w-5 h-5 flex-shrink-0" style={{ color: '#6366f1' }} />
                    <div>
                        <p className="text-xs font-black uppercase tracking-tight mb-1" style={{ color: '#6366f1' }}>
                            Anti-Liquidation Active
                        </p>
                        <p className="text-[10px] font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            Your vault has been automatically protected. Yield redirected to debt repayment. No liquidation penalty applied.
                        </p>
                    </div>
                </div>
                
                <Link href="/market" className="block mt-4">
                    <Button variant="outline" size="sm" className="w-full font-black text-xs uppercase tracking-widest">
                        View Market Simulator <ArrowRight className="w-3 h-3 ml-2" />
                    </Button>
                </Link>
            </Card>
        </motion.div>
    );
}

export default function DashboardPage() {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const contracts = getContractsForChain(chainId);
    const { value: collateral, isLoading: cl } = useCollateralValue();
    const { debt, isLoading: dl } = useDebt();
    const { healthFactor, rawHealthFactor, isSafe, isLoading: hl } = useHealthFactor();
    const { mode } = useLoanMode();
    const { maxBorrow, isLoading: ml } = useMaxBorrow();
    const { score } = useBorrowerScore();

    // Crash result state
    const [crashResult, setCrashResult] = useState<CrashResult | null>(null);

    // Load crash result from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('lastCrashResult');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.healthFactorBefore === null) parsed.healthFactorBefore = Infinity;
                if (parsed.healthFactorAfter === null) parsed.healthFactorAfter = Infinity;
                // Only show if less than 1 hour old
                if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
                    setCrashResult(parsed);
                } else {
                    localStorage.removeItem('lastCrashResult');
                }
            } catch {
                localStorage.removeItem('lastCrashResult');
            }
        }
    }, []);

    const dismissCrashResult = () => {
        setCrashResult(null);
        localStorage.removeItem('lastCrashResult');
    };

    if (!isConnected) {
        return (
            <motion.div
                className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-8"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className="w-24 h-24 border-2 rounded-3xl flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(var(--ink-rgb),0.2)]"
                    style={{ borderColor: 'var(--border-strong)', background: 'var(--ink)' }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                >
                    <Wallet className="w-10 h-10" style={{ color: 'var(--surface)' }} />
                </motion.div>
                <div>
                    <h1 className="text-4xl font-black mb-3 uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>Connect Wallet</h1>
                    <p className="max-w-md mx-auto font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Connect to Moonbase Alpha to view your live position, health factor, and protocol stats.
                    </p>
                </div>
                <ConnectButton />
            </motion.div>
        );
    }

    // Use simulated values if crash result exists, otherwise use real contract values
    const colN = crashResult ? crashResult.collateralAfter : parseFloat(collateral);
    const debtN = parseFloat(debt);
    const maxN = crashResult ? colN * 0.75 : parseFloat(maxBorrow);
    const avail = Math.max(0, maxN - debtN);
    const util = maxN > 0 ? Math.min((debtN / maxN) * 100, 100) : 0;

    // Use simulated health factor if crash result exists
    const displayHealthFactor = crashResult ? crashResult.healthFactorAfter : rawHealthFactor;
    const displayHealthFactorStr = crashResult 
        ? (crashResult.healthFactorAfter === Infinity ? '∞' : crashResult.healthFactorAfter.toFixed(0))
        : healthFactor;

    const hfColor = displayHealthFactor >= 150 ? '#000000' : displayHealthFactor >= 100 ? '#f39c12' : '#e74c3c';
    const scoreColor = score >= 80 ? '#000000' : score >= 60 ? '#f39c12' : '#e74c3c';
    const modeBadge = MODE_BADGE[mode] ?? MODE_BADGE.Flexible;

    return (
        <div className="space-y-12">

            {/* Crash Result Alert */}
            {crashResult && (
                <CrashResultCard result={crashResult} onDismiss={dismissCrashResult} />
            )}

            {/* Header */}
            <motion.div
                className="flex items-center justify-between flex-wrap gap-6 border-b-2 pb-8"
                style={{ borderColor: 'var(--border-strong)' }}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
                    <p className="font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>Your live position on Moonbase Alpha (Polkadot)</p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    {crashResult ? (
                        <Badge variant="destructive" className="px-6 py-2 animate-pulse">
                            <TrendingDown className="w-3.5 h-3.5 mr-1" /> Simulated Crash
                        </Badge>
                    ) : (
                        <Badge variant="conf" className="px-6 py-2">
                            <Activity className="w-3.5 h-3.5 mr-1" /> Live
                        </Badge>
                    )}
                    <Badge variant={mode === 'Flexible' ? 'success' : mode === 'Conservative' ? 'warning' : 'destructive'} className="px-6 py-2">
                        {modeBadge.label} Mode
                    </Badge>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Collateral Value" value={`$${colN.toFixed(4)}`} 
                    sub={crashResult ? "Simulated (Post-Crash)" : "Risk-adjusted"} 
                    loading={cl} i={0} />
                <StatCard label="Current Debt" value={`$${debtN.toFixed(4)}`} sub="Active USDC loan" loading={dl} i={1}
                    color={debtN > 0 ? '#ef4444' : '#000000'} />
                <StatCard label="Available to Borrow" value={`$${avail.toFixed(4)}`} sub={`Max $${maxN.toFixed(2)}`} loading={ml} i={2} />
                <StatCard label="Health Factor" value={displayHealthFactorStr} 
                    sub={crashResult ? "Simulated (Post-Crash)" : (displayHealthFactor >= 150 ? 'Safe ✅' : displayHealthFactor >= 100 ? 'At risk ⚠️' : 'Critical 🔴')} 
                    loading={hl} i={3}
                    color={hfColor} />
            </div>

            {/* Utilization + Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" /> Loan Utilization
                        </h3>
                        <span className="text-2xl font-black">
                            <AnimatedNumber value={util} suffix="%" decimals={1} />
                        </span>
                    </div>
                    <Progress value={util}
                        className="h-4 border-2"
                        style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--muted))' }}
                        indicatorClassName={util > 80 ? 'bg-red-500' : util > 60 ? 'bg-yellow-500' : 'bg-foreground'} />
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                        <span>$0</span><span>Max ${maxN.toFixed(2)}</span>
                    </div>
                    {debtN <= 0 && (
                        <Link href="/deposit">
                            <Button variant="link" size="sm" className="p-0 h-auto font-black text-[10px] tracking-widest uppercase">
                                <ArrowRight className="w-3 h-3 mr-1" /> Deposit collateral to start borrowing
                            </Button>
                        </Link>
                    )}
                </Card>

                <Card className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" /> Borrower Score
                        </h3>
                        <span className="text-2xl font-black" style={{ color: scoreColor }}>
                            <AnimatedNumber value={score} suffix="/100" decimals={0} />
                        </span>
                    </div>
                    <Progress value={score}
                        className="h-4 border-2"
                        style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--muted))' }}
                        indicatorClassName={score >= 80 ? 'bg-foreground' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'} />
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                        {score >= 80 ? 'Reliable borrower — eligible for Flexible mode'
                            : score >= 60 ? 'Moderate — repay on time to improve'
                                : 'Low score — late repayments or liquidations detected'}
                    </p>
                </Card>
            </div>

            {/* Token balances */}
            <Card className="p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'hsl(var(--border) / 0.1)' }}>
                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Wallet className="w-5 h-5" /> Wallet Balances
                    </h3>
                    <Link href="/faucet">
                        <Button variant="outline" size="sm" className="h-9 px-4 font-black">
                            <RefreshCw className="w-3 h-3 mr-2" /> REFILL
                        </Button>
                    </Link>
                </div>
                <div className="space-y-2">
                    <TokenRow name="Mock DOT" symbol="mDOT" address={contracts.mockDOT as `0x${string}`} weight={85} color="#e91e8c" i={0} />
                    <TokenRow name="Mock WBTC" symbol="mWBTC" address={contracts.mockWBTC as `0x${string}`} weight={90} color="#f7931a" i={1} />
                    <TokenRow name="Mock Yield" symbol="mYLD" address={contracts.mockYield as `0x${string}`} weight={80} color="#f59e0b" i={1} />
                    <TokenRow name="Mock RWA" symbol="mRWA" address={contracts.mockRWA as `0x${string}`} weight={100} color="#6366f1" i={2} />
                </div>
            </Card>

            {/* Quick actions moved to bottom or removed if redundant */}
        </div>
    );
}
