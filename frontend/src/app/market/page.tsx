'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useReadContract, useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS } from '@/config/contracts';
import { useCollateralValue, useDebt } from '@/hooks/useProtocolData';
import {
    TrendingDown, Activity, Zap, RefreshCw, Shield, AlertTriangle,
    BarChart2, Flame, Check, ChevronRight, Lock, Shuffle, BarChart,
    DollarSign, Database, ArrowRight, Droplets
} from 'lucide-react';
import { Card, Button, Badge, MotionCard } from '@/components/ui';
import Link from 'next/link';

/* ── ABIs ──────────────────────────────────────── */
const ORACLE_ABI = [
    { name: 'getPrice', type: 'function', inputs: [{ name: 'token', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
    { name: 'marketVolatility', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
    { name: 'simulateCrash', type: 'function', inputs: [{ name: 'tokens', type: 'address[]' }, { name: 'dropPercent', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
    { name: 'setPrice', type: 'function', inputs: [{ name: 'token', type: 'address' }, { name: 'price', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
    { name: 'setVolatility', type: 'function', inputs: [{ name: 'vol', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
] as const;

const ORACLE = CONTRACTS.mockOracle as `0x${string}`;

/* ── Gas helper ─────────────────────────────────── */
async function safeGasPrice(pc: ReturnType<typeof usePublicClient>): Promise<bigint> {
    try { const g = await pc!.getGasPrice(); const b = g * 130n / 100n; return b < 500_000_000n ? b : 500_000_000n; }
    catch { return 100_000_000n; }
}

/* ── Chart helpers ──────────────────────────────── */
const N = 40;
function genHistory(base: number, seed: number): number[] {
    const d: number[] = []; let p = base;
    for (let i = 0; i < N; i++) {
        const t = i * 0.25 + seed;
        p *= 1 + 0.008 * Math.sin(t) + 0.005 * Math.sin(t * 2.3 + 1) + 0.003 * Math.sin(t * 5.1 + 2);
        d.push(Math.max(0.001, p));
    }
    return d;
}
function smooth(pts: [number, number][]): string {
    if (pts.length < 2) return '';
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const cx = (pts[i][0] + pts[i + 1][0]) / 2;
        d += ` C${cx.toFixed(1)},${pts[i][1].toFixed(1)} ${cx.toFixed(1)},${pts[i + 1][1].toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
    }
    return d;
}
function area(pts: [number, number][], H: number): string {
    return `${smooth(pts)} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
}
function toPts(data: number[], W: number, H: number): [number, number][] {
    const min = Math.min(...data) * 0.97, max = Math.max(...data) * 1.03, rng = max - min || 0.001;
    return data.map((v, i) => [(i / (data.length - 1)) * W, H - 6 - ((v - min) / rng) * (H - 18)]);
}

/* ── Price Chart ─────────────────────────────────── */
function PriceChart({ sets, crashed }: { sets: { key: string; data: number[]; color: string }[]; crashed: boolean }) {
    const W = 800, H = 200;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border-2" style={{ height: 200, background: 'hsl(var(--card))', borderColor: 'var(--border-strong)' }}>
            {[0.25, 0.5, 0.75].map(r => <line key={r} x1="0" y1={r * H} x2={W} y2={r * H} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />)}
            {crashed && <rect x="0" y="0" width={W} height={H} fill="rgba(239,68,68,0.05)" />}
            {sets.map(({ key, data, color }, i) => {
                const pts = toPts(data, W, H);
                return (<g key={key}><path d={smooth(pts)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" /></g>);
            })}
            {sets.map(({ key, data, color }) => { const pts = toPts(data, W, H); const [lx, ly] = pts[pts.length - 1]; return <g key={`d-${key}`}><circle cx={lx} cy={ly} r="6" fill="black" /><circle cx={lx} cy={ly} r="4" fill={color} /></g>; })}
            {['−40m', '−30m', '−20m', '−10m', 'Now'].map((l, i, a) => <text key={l} x={(i / (a.length - 1)) * W} y={H - 5} textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="900" className="uppercase tracking-widest">{l}</text>)}
        </svg>
    );
}

/* ── Animated story steps ───────────────────────── */
const STORY_STEPS = [
    {
        id: 'crash',
        icon: TrendingDown,
        color: '#ef4444',
        title: 'Token Prices Drop',
        plain: 'The market crashes. All token prices fall sharply.',
        technical: 'MockOracle.simulateCrash() updates on-chain prices. marketVolatility → 90.',
        contract: 'MockOracle',
        delay: 0,
    },
    {
        id: 'collateral',
        icon: BarChart,
        color: '#f59e0b',
        title: 'Collateral Loses Value',
        plain: 'Your deposited tokens are now worth less — your borrowing power shrinks.',
        technical: 'CollateralManager.getTotalCollateralValue() recalculates: value = Σ(amount × oraclePrice × weight/100).',
        contract: 'CollateralManager',
        delay: 900,
    },
    {
        id: 'health',
        icon: AlertTriangle,
        color: '#f59e0b',
        title: 'Health Factor Drops',
        plain: 'The protocol checks if your loan is still safe. Lower prices mean a lower safety score.',
        technical: 'HealthFactor = (collateralValue × 85) / debt. Below 150 = warning. Below 100 = liquidation risk.',
        contract: 'CollateralManager',
        delay: 1800,
    },
    {
        id: 'mode',
        icon: Shuffle,
        color: '#ef4444',
        title: 'Vault Mode Switches',
        plain: 'The system automatically switches your vault to a protection mode — no action needed from you.',
        technical: 'CollateralManager.autoUpdateMode(): volatility > 80 → Freeze. HF < 150 → Conservative.',
        contract: 'AntiLiquidation',
        delay: 2700,
    },
    {
        id: 'protect',
        icon: Shield,
        color: '#6366f1',
        title: 'Protocol Protects You',
        plain: 'Instead of immediately liquidating, SECP activates its anti-liquidation system. Yield is redirected to repay your loan slowly.',
        technical: 'AntiLiquidation.activateProtection() → vault frozen. YieldManager diverts earnings to LoanManager.repayFromProtection().',
        contract: 'YieldManager',
        delay: 3600,
    },
];

/* ── Protocol component nodes ───────────────────── */
type NodeStatus = 'idle' | 'processing' | 'alert' | 'done';
interface ComponentNodeProps {
    name: string;
    label: string;
    status: NodeStatus;
    color: string;
    desc: string;
    icon: React.ElementType;
    arrow?: boolean;
}
function ComponentNode({ name, label, status, color, desc, icon: Icon, arrow }: ComponentNodeProps) {
    const active = status !== 'idle';
    return (
        <div className="flex items-center gap-4">
            <div className={`flex-1 rounded-2xl p-4 transition-all duration-500 border-2 shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),1)] hover:-translate-y-1 ${active ? '' : 'opacity-50'}`}
                style={{
                    background: active ? 'hsl(var(--card))' : 'hsl(var(--muted))',
                    borderColor: active ? 'var(--border-strong)' : 'hsl(var(--border) / 0.1)',
                }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-[2px_2px_0px_0px_rgba(var(--ink-rgb),1)]" style={{ background: 'hsl(var(--card))', borderColor: 'var(--border-strong)' }}>
                        <Icon className="w-5 h-5" style={{ color: active ? color : 'var(--text-secondary)' }} />
                    </div>
                    <div>
                        <p className="text-sm font-black uppercase tracking-tighter">{name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                    </div>
                </div>
                {active && <p className="text-[10px] font-medium mt-3 leading-relaxed uppercase tracking-widest border-t pt-3" style={{ color: 'var(--text-secondary)', borderColor: 'hsl(var(--border) / 0.1)' }}>{desc}</p>}
            </div>
            {arrow && <ArrowRight className="w-6 h-6 border-2 rounded-full p-1" style={{ borderColor: 'var(--border-strong)' }} />}
        </div>
    );
}

/* ── Main Page ───────────────────────────────────── */
const CRASH_OPTS = [20, 40, 60, 80] as const;
const BASE = { mUSDC: 1.0, mYLD: 1.05, mRWA: 1.5 };

export default function MarketPage() {
    const { isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();
    const { value: colValue } = useCollateralValue();
    const { debt } = useDebt();

    const [intensity, setIntensity] = useState<20 | 40 | 60 | 80>(40);
    const [crashState, setCrashState] = useState<'idle' | 'crashing' | 'crashed' | 'resetting'>('idle');
    const [onChainOk, setOnChainOk] = useState<boolean | null>(null);
    const [localDrop, setLocalDrop] = useState(0);
    const [txStatus, setTxStatus] = useState('');
    const [activeStep, setActiveStep] = useState(-1);
    const [crashProgress, setCrashProgress] = useState(0);
    const crashInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

    /* Oracle reads */
    const { data: pUD, refetch: rU } = useReadContract({ address: ORACLE, abi: ORACLE_ABI, functionName: 'getPrice', args: [CONTRACTS.mockUSDC as `0x${string}`], query: { refetchInterval: 5000 } });
    const { data: pYD, refetch: rY } = useReadContract({ address: ORACLE, abi: ORACLE_ABI, functionName: 'getPrice', args: [CONTRACTS.mockYield as `0x${string}`], query: { refetchInterval: 5000 } });
    const { data: pRD, refetch: rR } = useReadContract({ address: ORACLE, abi: ORACLE_ABI, functionName: 'getPrice', args: [CONTRACTS.mockRWA as `0x${string}`], query: { refetchInterval: 5000 } });
    const { data: volD, refetch: rV } = useReadContract({ address: ORACLE, abi: ORACLE_ABI, functionName: 'marketVolatility', query: { refetchInterval: 5000 } });

    const pU = pUD ? parseFloat(formatEther(pUD as bigint)) : BASE.mUSDC;
    const pY = pYD ? parseFloat(formatEther(pYD as bigint)) : BASE.mYLD;
    const pR = pRD ? parseFloat(formatEther(pRD as bigint)) : BASE.mRWA;
    const vol = Number(volD ?? 0n);

    /* Chart data */
    const histBase = useMemo(() => ({ mUSDC: genHistory(BASE.mUSDC, 0), mYLD: genHistory(BASE.mYLD, 3), mRWA: genHistory(BASE.mRWA, 7) }), []);
    const scale = (h: number[], live: number) => { const l = h[h.length - 1]; return h.map(v => v * (live / l)); };

    const chartData = useMemo(() => {
        const drop = localDrop / 100;
        const tail = (live: number) => Array.from({ length: crashProgress }, (_, i) => {
            const e = 1 - Math.pow(1 - (i + 1) / 10, 2);
            return live * (1 - e * drop);
        });
        return {
            mUSDC: [...scale(histBase.mUSDC, pU), ...tail(pU)],
            mYLD: [...scale(histBase.mYLD, pY), ...tail(pY)],
            mRWA: [...scale(histBase.mRWA, pR), ...tail(pR)],
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [crashProgress, localDrop, pU, pY, pR]);

    const chartSets = [
        { key: 'mUSDC', data: chartData.mUSDC, color: '#22c55e' },
        { key: 'mYLD', data: chartData.mYLD, color: '#f59e0b' },
        { key: 'mRWA', data: chartData.mRWA, color: '#6366f1' },
    ];

    // Derived metrics
    const drop = localDrop / 100;
    const colN = parseFloat(colValue);
    const debtN = parseFloat(debt);
    const newCol = colN * (1 - drop);
    const oldHF = debtN > 0 ? colN * 85 / debtN : Infinity;
    const newHF = debtN > 0 ? newCol * 85 / debtN : Infinity;
    const newMode = newHF === Infinity ? 'Flexible' : newHF < 100 ? 'Freeze' : newHF < 150 ? 'Conservative' : 'Flexible';
    const modeColor = newMode === 'Freeze' ? '#ef4444' : newMode === 'Conservative' ? '#f59e0b' : '#22c55e';

    /* Component statuses (mapped from activeStep) */
    const getStatus = (contractName: string): NodeStatus => {
        if (crashState === 'idle') return 'idle';
        const idx = STORY_STEPS.findIndex(s => s.contract === contractName && STORY_STEPS.indexOf(s) <= activeStep);
        if (idx === -1) return 'idle';
        if (STORY_STEPS[idx].id === 'crash') return activeStep >= 1 ? 'done' : 'processing';
        if (STORY_STEPS[idx].id === 'protect') return activeStep >= 4 ? 'done' : activeStep === 4 ? 'alert' : 'idle';
        return activeStep > idx ? 'done' : 'processing';
    };

    const cmpStatus = (name: string): NodeStatus => {
        if (crashState === 'idle') return 'idle';
        const map: Record<string, number> = {
            'MockOracle': 0, 'CollateralManager': 1, 'AntiLiquidation': 3, 'YieldManager': 4, 'LoanManager': 4, 'SmartVault': 3
        };
        const threshold = map[name] ?? 99;
        if (activeStep < threshold) return 'idle';
        if (activeStep === threshold) return name === 'AntiLiquidation' ? 'alert' : 'processing';
        return 'done';
    };

    /* Crash handler */
    const handleCrash = useCallback(async () => {
        if (crashState !== 'idle') return;
        setCrashState('crashing');
        setLocalDrop(intensity);
        setCrashProgress(0);
        setActiveStep(-1);
        stepTimers.current.forEach(clearTimeout);
        stepTimers.current = [];

        // Animate chart
        let step = 0;
        crashInterval.current = setInterval(() => {
            step++;
            setCrashProgress(step);
            if (step >= 10) { clearInterval(crashInterval.current!); setCrashState('crashed'); }
        }, 80);

        // Reveal story steps on delay
        STORY_STEPS.forEach((s, i) => {
            const t = setTimeout(() => setActiveStep(i), s.delay + 400);
            stepTimers.current.push(t);
        });

        // On-chain attempt
        if (isConnected) {
            try {
                setTxStatus('Submitting to blockchain…');
                const gasPrice = await safeGasPrice(publicClient);
                const hash = await writeContractAsync({
                    address: ORACLE, abi: ORACLE_ABI, functionName: 'simulateCrash',
                    args: [[CONTRACTS.mockUSDC, CONTRACTS.mockYield, CONTRACTS.mockRWA].map(a => a as `0x${string}`), BigInt(intensity)],
                    gas: 200_000n, gasPrice,
                });
                await publicClient!.waitForTransactionReceipt({ hash, confirmations: 1 });
                setOnChainOk(true);
                setTxStatus(`✅ On-chain prices updated (${hash.slice(0, 10)}…)`);
                rU(); rY(); rR(); rV();
            } catch (err: any) {
                setOnChainOk(false);
                const m = err?.message ?? '';
                if (m.includes('not the owner') || m.includes('Ownable')) setTxStatus('ℹ️ Visual demo only — not the protocol owner');
                else if (m.includes('User rejected') || m.includes('denied')) setTxStatus('ℹ️ Cancelled — showing visual simulation');
                else setTxStatus('ℹ️ On-chain failed — showing local simulation');
            }
        } else {
            setOnChainOk(false);
            setTxStatus('🔌 Wallet not connected — visual simulation mode');
        }
    }, [crashState, intensity, isConnected, publicClient, writeContractAsync, rU, rY, rR, rV]);

    const handleReset = useCallback(async () => {
        if (crashInterval.current) clearInterval(crashInterval.current);
        stepTimers.current.forEach(clearTimeout);
        setCrashState('resetting');
        setLocalDrop(0); setCrashProgress(0); setActiveStep(-1); setTxStatus('');

        if (isConnected && onChainOk) {
            try {
                const gasPrice = await safeGasPrice(publicClient);
                for (const [a, p] of [[CONTRACTS.mockUSDC, parseEther('1')], [CONTRACTS.mockYield, parseEther('1.05')], [CONTRACTS.mockRWA, parseEther('1.5')]] as const) {
                    const h = await writeContractAsync({ address: ORACLE, abi: ORACLE_ABI, functionName: 'setPrice', args: [a as `0x${string}`, p], gas: 80_000n, gasPrice });
                    await publicClient!.waitForTransactionReceipt({ hash: h, confirmations: 1 });
                }
                const h2 = await writeContractAsync({ address: ORACLE, abi: ORACLE_ABI, functionName: 'setVolatility', args: [20n], gas: 60_000n, gasPrice });
                await publicClient!.waitForTransactionReceipt({ hash: h2, confirmations: 1 });
                rU(); rY(); rR(); rV();
            } catch { /* UI reset only */ }
        }
        setOnChainOk(null);
        setCrashState('idle');
        setTxStatus('');
    }, [isConnected, onChainOk, publicClient, writeContractAsync, rU, rY, rR, rV]);

    useEffect(() => () => {
        if (crashInterval.current) clearInterval(crashInterval.current);
        stepTimers.current.forEach(clearTimeout);
    }, []);

    const crashed = crashState === 'crashed';
    const crashing = crashState === 'crashing';
    const hasPosition = colN > 0;
    const volDisplay = crashed ? 90 : vol;
    const volColor = volDisplay > 70 ? '#ef4444' : volDisplay > 40 ? '#f59e0b' : '#22c55e';

    return (
        <div className="space-y-12 max-w-6xl mx-auto">

            {/* Header */}
            <div className="border-b-2 pb-8 flex items-center justify-between flex-wrap gap-6" style={{ borderColor: 'var(--border-strong)' }}>
                <div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter flex items-center gap-4">
                        <TrendingDown className="w-12 h-12 text-[#ef4444]" /> Market
                    </h1>
                    <p className="font-normal mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Stress-test the SECP Protocol anti-liquidation shields.
                    </p>
                </div>
                <Badge variant="conf" className="px-6 py-2 uppercase font-black tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Live Simulator
                </Badge>
            </div>

            {/* Price cards + volatility */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { sym: 'mUSDC', live: pU, color: '#22c55e' },
                    { sym: 'mYLD', live: pY, color: '#f59e0b' },
                    { sym: 'mRWA', live: pR, color: '#6366f1' },
                ].map(({ sym, live, color }) => {
                    const after = live * (1 - drop);
                    return (
                        <Card key={sym} className="p-6 transition-all duration-500"
                            style={crashed ? { borderColor: '#ef4444' } : {}}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>{sym}</p>
                            <p className={`text-3xl font-black tracking-tighter ${crashed ? 'text-red-500' : ''}`}
                                style={crashed ? undefined : { color: 'hsl(var(--foreground))' }}>
                                ${(crashed ? after : live).toFixed(4)}
                            </p>
                            {crashed && (
                                <Badge variant="destructive" className="mt-3 text-[10px] font-black uppercase">
                                    −{localDrop}% CRASH
                                </Badge>
                            )}
                        </Card>
                    );
                })}

                <Card className="p-6" style={{ background: volDisplay > 70 ? 'hsl(var(--destructive) / 0.08)' : 'hsl(var(--card))', borderColor: volDisplay > 70 ? '#ef4444' : 'var(--border-strong)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Volatility</p>
                    <p className="text-3xl font-black tracking-tighter" style={{ color: 'hsl(var(--foreground))' }}>{volDisplay}%</p>
                    <div className="h-4 border-2 rounded-full mt-3 overflow-hidden" style={{ background: 'hsl(var(--muted))', borderColor: 'var(--border-strong)' }}>
                        <div className="h-full bg-current transition-all duration-1000" style={{ width: `${volDisplay}%`, background: 'var(--ink)' }} />
                    </div>
                </Card>
            </div>

            {/* Chart */}
            <Card className="p-8 group shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
                style={crashed ? { borderColor: '#ef4444' } : {}}>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        <BarChart2 className="w-8 h-8" /> Price Feed
                    </h2>
                    <div className="flex items-center gap-4">
                        {[['mUSDC', '#22c55e'], ['mYLD', '#f59e0b'], ['mRWA', '#6366f1']].map(([k, c]) => (
                            <div key={k} className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-black rounded-full" style={{ background: c }} />
                                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">{k}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <PriceChart sets={chartSets} crashed={crashed} />
            </Card>

            {/* ── Two-column layout: Crash Panel + Story ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Crash Controls (left, 2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="p-8 space-y-8" style={{ background: crashed ? '#fef2f2' : 'hsl(var(--card))', borderColor: crashed ? '#ef4444' : 'var(--border-strong)' }}>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),0.2)]" style={{ background: 'var(--ink)', borderColor: 'var(--border-strong)' }}>
                                <Flame className="w-6 h-6" style={{ color: 'var(--surface)' }} />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Simulator</h2>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Crash Intensity</label>
                            <div className="grid grid-cols-2 gap-3">
                                {CRASH_OPTS.map(p => (
                                    <button key={p} onClick={() => setIntensity(p)} disabled={crashState !== 'idle'}
                                        className={`p-4 rounded-2xl border-2 transition-all shadow-[4px_4px_0px_0px_rgba(35,30,25,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${intensity === p ? '' : ''}`}
                                        style={{
                                            borderColor: 'var(--border-strong)',
                                            background: intensity === p ? '#ffe8d0' : 'hsl(var(--card))',
                                            color: 'hsl(var(--foreground))',
                                        }}>
                                        <p className="font-extrabold text-xl tracking-tighter">−{p}%</p>
                                        <p className={`text-[10px] font-extrabold uppercase tracking-widest`} style={{ color: intensity === p ? 'hsl(var(--foreground) / 0.6)' : 'var(--text-secondary)' }}>
                                            {p <= 20 ? 'MILD' : p <= 40 ? 'MOD.' : p <= 60 ? 'SEVERE' : 'CRITICAL'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick preview */}
                        {crashState === 'idle' && hasPosition && debtN > 0 && (
                            <div className="rounded-2xl p-6 border-2 border-dashed border-black/20 bg-[var(--bg-warm-footer)]/20 space-y-3 font-black uppercase tracking-widest text-[10px]">
                                <p className="text-[#ef4444] mb-2 font-black">Projected Impact:</p>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500 font-normal">Collateral</span>
                                    <span className="text-[#ef4444]">${colN.toFixed(2)} → ${newCol.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500 font-normal">Health Factor</span>
                                    <span className={newHF < 100 ? 'text-[#ef4444]' : 'text-amber-600'}>{oldHF === Infinity ? '∞' : oldHF.toFixed(2)} → {newHF === Infinity ? '∞' : newHF.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {txStatus && <p className="text-[10px] font-black uppercase tracking-widest border-2 p-4 rounded-xl" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}>{txStatus}</p>}

                        <div className="space-y-4 pt-4">
                            <Button onClick={handleCrash} disabled={crashState !== 'idle'}
                                size="lg"
                                className="w-full h-16 font-extrabold uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(35,30,25,1)] bg-[#e65555] hover:bg-[#d44444] border-2 border-black transition-all">
                                {crashing ? '⚡ CRASHING…' : crashed ? '🔥 MARKET DOWN' : `🔥 CRASH MARKET −${intensity}%`}
                            </Button>

                            {crashState !== 'idle' && (
                                <Button onClick={handleReset} disabled={crashState === 'resetting'}
                                    variant="outline"
                                    size="lg"
                                    className="w-full h-16 font-black uppercase tracking-widest border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]">
                                    <RefreshCw className="w-5 h-5 mr-2" /> RECOVERY MODE
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Protocol component status */}
                    {(crashing || crashed) && (
                        <Card className="p-8 space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Protocol Response</p>
                            <ComponentNode name="MockOracle" icon={Database} color="#ef4444" label="DEFIED" status={cmpStatus('MockOracle')} desc="Broadcasting new token prices to all contracts" arrow={false} />
                            <ComponentNode name="CollateralManager" icon={BarChart} color="#f59e0b" label="SYNCING" status={cmpStatus('CollateralManager')} desc="Recomputing collateral values and health factors" arrow={false} />
                            <ComponentNode name="SmartVault" icon={Lock} color="#f59e0b" label="SHIELDED" status={cmpStatus('SmartVault')} desc="Reviewing all active vault positions" arrow={false} />
                            <ComponentNode name="AntiLiquidation" icon={Shield} color="#ef4444" label="ACTIVE" status={cmpStatus('AntiLiquidation')} desc="Freezing at-risk vaults instead of liquidating" arrow={false} />
                        </Card>
                    )}
                </div>

                {/* Story steps (right, 3 cols) */}
                <div className="lg:col-span-3">
                    {crashState === 'idle' ? (
                        /* Idle state — explain the system */
                        <Card className="p-12 h-full flex flex-col justify-center border-2 shadow-[12px_12px_0px_0px_rgba(var(--ink-rgb),1)]" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}>
                            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 px-4 py-2 rounded-xl inline-block w-fit" style={{ background: 'color-mix(in srgb, var(--bg-warm-footer) 40%, transparent)' }}>Anti-Liquidation Engine</h2>
                            <div className="space-y-8">
                                {STORY_STEPS.map((s, i) => (
                                    <div key={s.id} className="flex items-start gap-6 group">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-black border-2 shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),1)] group-hover:-translate-y-1 transition-all"
                                            style={{ color: s.color, borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-black text-lg uppercase tracking-tight">{s.title}</p>
                                            <p className="text-xs font-normal mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.plain}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-12 rounded-2xl p-6 border-2 shadow-inner flex items-start gap-4" style={{ borderColor: 'hsl(var(--border) / 0.1)', background: 'hsl(var(--muted))' }}>
                                <Shield className="w-6 h-6 flex-shrink-0" style={{ color: 'hsl(var(--foreground))' }} />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    💡 Unlike traditional DeFi which immediately liquidates your position, SECP uses its Anti-Liquidation system to give you time to recover — protecting your collateral even during extreme market events.
                                </p>
                            </div>
                        </Card>
                    ) : (
                        /* Active crash — animated story */
                        <div className="space-y-6">
                            {STORY_STEPS.map((s, i) => {
                                const visible = activeStep >= i;
                                const active = activeStep === i;
                                const done = activeStep > i;
                                return (
                                    <Card key={s.id}
                                        className="p-8 transition-all duration-500"
                                        style={{
                                            opacity: visible ? 1 : 0,
                                            transform: visible ? 'translateY(0)' : 'translateY(24px)',
                                            borderColor: visible ? 'var(--border-strong)' : 'hsl(var(--border) / 0.1)',
                                            background: active ? 'color-mix(in srgb, var(--bg-warm-footer) 30%, hsl(var(--card)))' : 'hsl(var(--card))',
                                            boxShadow: visible ? '8px 8px 0px 0px rgba(var(--ink-rgb),1)' : 'none'
                                        }}>
                                        <div className="flex items-start gap-6">
                                            {/* Step number / icon */}
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),1)]"
                                                style={{ color: s.color, borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}>
                                                {done
                                                    ? <Check className="w-6 h-6 text-green-500" />
                                                    : active
                                                        ? <div className="spinner" style={{ borderColor: 'var(--ink)', borderTopColor: 'transparent' }} />
                                                        : <s.icon className="w-6 h-6" />
                                                }
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                                    <Badge variant="conf" className="text-[10px] font-black uppercase">STEP {i + 1}</Badge>
                                                    <Badge variant="outline" className="text-[10px] font-black uppercase border-black">{s.contract}</Badge>
                                                    {active && <span className="text-[10px] font-black uppercase tracking-widest text-red-500 animate-pulse">● EXECUTING</span>}
                                                    {done && <span className="text-[10px] font-black uppercase tracking-widest text-green-500">✓ SECURED</span>}
                                                </div>

                                                <p className="text-xl font-black uppercase tracking-tighter" style={{ color: 'hsl(var(--foreground))' }}>{s.title}</p>
                                                <p className="text-xs font-medium mt-2 leading-relaxed uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{s.plain}</p>

                                                {/* Technical detail */}
                                                {visible && (
                                                    <div className="mt-4 rounded-xl px-4 py-3 border-2 font-mono text-[10px] break-all" style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border) / 0.1)', color: 'var(--text-secondary)' }}>
                                                        {s.technical}
                                                    </div>
                                                )}

                                                {/* Specific metrics for relevant steps */}
                                                {visible && s.id === 'health' && hasPosition && debtN > 0 && (
                                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                                        <div className="rounded-xl p-4 border-2" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}>
                                                            <p className="text-[10px] font-black uppercase" style={{ color: 'var(--text-secondary)' }}>OLD HF</p>
                                                            <p className="text-xl font-black">{oldHF === Infinity ? '∞' : oldHF.toFixed(2)}</p>
                                                        </div>
                                                        <div className="rounded-xl p-4 border-2 border-red-500" style={{ background: 'hsl(var(--destructive) / 0.05)' }}>
                                                            <p className="text-[10px] font-black uppercase text-red-400">NEW HF</p>
                                                            <p className="text-xl font-black text-red-600">{newHF === Infinity ? '∞' : newHF.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}

                            {/* Final summary */}
                            {crashed && activeStep >= STORY_STEPS.length - 1 && (
                                <Card className="p-8 border-2 shadow-[12px_12px_0px_0px_rgba(var(--ink-rgb),1)]" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}>
                                    <p className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                                        <Shield className="w-8 h-8" /> Protection Active
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            'Zero Liquidation Penalty',
                                            'Vault Frozen for Safety',
                                            'Automatic Yield Repayment',
                                            'Borrower Score Preserved'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 p-4 border-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),0.1)]" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--muted))' }}>
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 border-t-2 pt-8" style={{ borderColor: 'var(--border-strong)' }}>
                                        <Button className="w-full h-16 font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(var(--ink-rgb),1)]" asChild>
                                            <Link href="/dashboard">RETURN TO DASHBOARD</Link>
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
