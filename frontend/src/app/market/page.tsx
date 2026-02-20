'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useReadContract, useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS } from '@/config/contracts';
import { useCollateralValue, useDebt } from '@/hooks/useProtocolData';
import {
    TrendingDown, Activity, Zap, RefreshCw, Shield, AlertTriangle,
    BarChart2, Flame, Check, ChevronRight, Lock, Shuffle, BarChart,
    DollarSign, Database, ArrowRight,
} from 'lucide-react';

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
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
            <defs>
                {[['g-g', '#22c55e'], ['g-a', '#f59e0b'], ['g-i', '#6366f1']].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity="0.22" /><stop offset="100%" stopColor={c} stopOpacity="0.02" />
                    </linearGradient>
                ))}
            </defs>
            {[0.25, 0.5, 0.75].map(r => <line key={r} x1="0" y1={r * H} x2={W} y2={r * H} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
            {crashed && <rect x="0" y="0" width={W} height={H} fill="rgba(239,68,68,0.05)" rx="8" />}
            {sets.map(({ key, data, color }, i) => {
                const g = ['url(#g-g)', 'url(#g-a)', 'url(#g-i)'][i];
                const pts = toPts(data, W, H);
                return (<g key={key}><path d={area(pts, H)} fill={g} /><path d={smooth(pts)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" /></g>);
            })}
            {sets.map(({ key, data, color }) => { const pts = toPts(data, W, H); const [lx, ly] = pts[pts.length - 1]; return <g key={`d-${key}`}><circle cx={lx} cy={ly} r="5" fill={color} opacity="0.35" /><circle cx={lx} cy={ly} r="3" fill={color} /></g>; })}
            {['−40m', '−30m', '−20m', '−10m', 'Now'].map((l, i, a) => <text key={l} x={(i / (a.length - 1)) * W} y={H - 1} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">{l}</text>)}
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
    const bg = status === 'idle' ? 'rgba(255,255,255,0.03)' : `${color}15`;
    const border = status === 'idle' ? 'rgba(255,255,255,0.08)' : `${color}40`;
    const pulse = status === 'processing' || status === 'alert';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl p-3 transition-all duration-500 relative"
                style={{ background: bg, border: `1px solid ${border}` }}>
                {pulse && (
                    <div className="absolute inset-0 rounded-xl opacity-30 animate-pulse"
                        style={{ background: color }} />
                )}
                <div className="relative flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}20` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white leading-tight">{name}</p>
                        <p className="text-xs mt-0.5" style={{ color: status === 'idle' ? '#6b6b8a' : color }}>{label}</p>
                    </div>
                    {status === 'processing' && (
                        <svg className="animate-spin w-3.5 h-3.5 ml-auto mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" style={{ color }}>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    )}
                    {status === 'done' && <Check className="w-3.5 h-3.5 ml-auto mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />}
                    {status === 'alert' && <AlertTriangle className="w-3.5 h-3.5 ml-auto mt-0.5 flex-shrink-0 animate-bounce" style={{ color }} />}
                </div>
                {status !== 'idle' && <p className="text-xs mt-1.5 leading-relaxed relative" style={{ color: '#a1a1c4' }}>{desc}</p>}
            </div>
            {arrow && <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: status === 'idle' ? '#3f3f5a' : '#6366f1' }} />}
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
        <div className="space-y-6 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <TrendingDown className="w-7 h-7 text-red-400" /> Market Simulator
                    </h1>
                    <p className="text-[#a1a1c4] mt-1 text-sm">
                        See exactly how SECP protects you during a market crash — step by step.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                    <Activity className="w-3.5 h-3.5" /> Live · Arbitrum Sepolia
                </div>
            </div>

            {/* Price cards + volatility */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { sym: 'mUSDC', live: pU, color: '#22c55e' },
                    { sym: 'mYLD', live: pY, color: '#f59e0b' },
                    { sym: 'mRWA', live: pR, color: '#6366f1' },
                ].map(({ sym, live, color }) => {
                    const after = live * (1 - drop);
                    return (
                        <div key={sym} className="glass-card p-4 transition-all duration-500"
                            style={crashed ? { borderColor: 'rgba(239,68,68,0.3)' } : {}}>
                            <p className="text-xs font-bold uppercase" style={{ color }}>{sym}</p>
                            <p className={`text-xl font-bold mt-1 transition-all ${crashed ? 'text-red-400' : 'text-white'}`}>
                                ${(crashed ? after : live).toFixed(4)}
                            </p>
                            {crashed && (
                                <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
                                    <TrendingDown className="w-3 h-3" /> −{localDrop}% (${live.toFixed(4)})
                                </p>
                            )}
                        </div>
                    );
                })}

                <div className="glass-card p-4 transition-all duration-1000"
                    style={{ background: `${volColor}10`, borderColor: `${volColor}30` }}>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: volColor }}>Volatility</p>
                    <p className="text-xl font-bold text-white mt-1">{volDisplay}%</p>
                    <div className="progress-track h-1.5 mt-2">
                        <div className="progress-fill h-1.5 transition-all duration-1000"
                            style={{ width: `${volDisplay}%`, background: volColor }} />
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="glass-card p-6 transition-all duration-500"
                style={crashed ? { borderColor: 'rgba(239,68,68,0.25)', boxShadow: '0 0 40px rgba(239,68,68,0.08)' } : {}}>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-indigo-400" /> Token Price Chart
                        {crashed && <span className="text-xs text-red-400 font-semibold animate-pulse ml-2">📉 CRASH ACTIVE</span>}
                    </h2>
                    <div className="flex items-center gap-4">
                        {[['mUSDC', '#22c55e'], ['mYLD', '#f59e0b'], ['mRWA', '#6366f1']].map(([k, c]) => (
                            <div key={k} className="flex items-center gap-1.5">
                                <div className="w-3 h-0.5 rounded" style={{ background: c }} />
                                <span className="text-xs text-[#a1a1c4]">{k}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <PriceChart sets={chartSets} crashed={crashed} />
            </div>

            {/* ── Two-column layout: Crash Panel + Story ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Crash Controls (left, 2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="glass-card p-5 space-y-4"
                        style={crashed ? { borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.04)' } : {}}>

                        <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-red-400" />
                            <h2 className="font-bold text-white">Crash Simulator</h2>
                            {onChainOk === true && <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>⛓️ On-chain</span>}
                            {onChainOk === false && <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>💻 Local</span>}
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-[#a1a1c4] mb-2">Drop all prices by:</p>
                            <div className="grid grid-cols-4 gap-2">
                                {CRASH_OPTS.map(p => (
                                    <button key={p} onClick={() => setIntensity(p)} disabled={crashState !== 'idle'}
                                        className="py-2.5 rounded-lg font-bold text-xs transition-all"
                                        style={{
                                            background: intensity === p ? `rgba(239,68,68,${p / 150})` : 'rgba(255,255,255,0.04)',
                                            border: `2px solid ${intensity === p ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
                                            color: intensity === p ? '#fca5a5' : '#6b6b8a',
                                        }}>
                                        −{p}%<br />
                                        <span style={{ fontSize: 9, fontWeight: 400 }}>{p <= 20 ? 'Mild' : p <= 40 ? 'Mod.' : p <= 60 ? 'Severe' : 'Critical'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick preview */}
                        {crashState === 'idle' && hasPosition && debtN > 0 && (
                            <div className="rounded-lg p-3 text-xs space-y-1"
                                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                <p className="font-semibold text-red-300">Your position after −{intensity}% crash:</p>
                                <div className="flex justify-between"><span className="text-[#a1a1c4]">Collateral value</span> <span className="text-red-400 font-semibold">${colN.toFixed(2)} → ${newCol.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-[#a1a1c4]">Health factor</span> <span className="font-semibold" style={{ color: newHF < 100 ? '#ef4444' : '#f59e0b' }}>{oldHF === Infinity ? '∞' : oldHF.toFixed(2)} → {newHF === Infinity ? '∞' : newHF.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-[#a1a1c4]">Mode</span> <span className="font-semibold" style={{ color: modeColor }}>{newMode}</span></div>
                            </div>
                        )}

                        {txStatus && <p className="text-xs text-[#a1a1c4] bg-white/5 px-3 py-2 rounded-lg">{txStatus}</p>}

                        <button onClick={handleCrash} disabled={crashState !== 'idle'}
                            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
                            style={crashState !== 'idle'
                                ? { background: 'rgba(239,68,68,0.25)', opacity: 0.6, cursor: 'not-allowed' }
                                : { background: 'linear-gradient(135deg,#dc2626,#991b1b)', boxShadow: '0 0 24px rgba(239,68,68,0.4)' }}>
                            {crashing ? (
                                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Crashing…</>
                            ) : crashed ? <><AlertTriangle className="w-4 h-4" /> Market Crashed</> : <><Flame className="w-4 h-4" /> Simulate −{intensity}% Crash</>}
                        </button>

                        {crashState !== 'idle' && (
                            <button onClick={handleReset} disabled={crashState === 'resetting'}
                                className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#86efac' }}>
                                <RefreshCw className="w-4 h-4" /> Reset Market
                            </button>
                        )}
                    </div>

                    {/* Protocol component status */}
                    {(crashing || crashed) && (
                        <div className="glass-card p-5 space-y-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#6b6b8a] mb-3">Protocol Response</p>
                            <ComponentNode name="MockOracle" icon={Database} color="#ef4444" label="Prices updated" status={cmpStatus('MockOracle')} desc="Broadcasting new token prices to all contracts" arrow={false} />
                            <ComponentNode name="CollateralManager" icon={BarChart} color="#f59e0b" label="Recalculating values" status={cmpStatus('CollateralManager')} desc="Recomputing collateral values and health factors" arrow={false} />
                            <ComponentNode name="SmartVault" icon={Lock} color="#f59e0b" label="Checking positions" status={cmpStatus('SmartVault')} desc="Reviewing all active vault positions" arrow={false} />
                            <ComponentNode name="AntiLiquidation" icon={Shield} color="#ef4444" label="Protection active" status={cmpStatus('AntiLiquidation')} desc="Freezing at-risk vaults instead of liquidating" arrow={false} />
                            <ComponentNode name="YieldManager" icon={Zap} color="#6366f1" label="Diverting yield" status={cmpStatus('YieldManager')} desc="Redirecting earnings to repay loans automatically" arrow={false} />
                            <ComponentNode name="LoanManager" icon={DollarSign} color="#22c55e" label="Loans protected" status={cmpStatus('LoanManager')} desc="Accepting automatic yield repayments" arrow={false} />
                        </div>
                    )}
                </div>

                {/* Story steps (right, 3 cols) */}
                <div className="lg:col-span-3">
                    {crashState === 'idle' ? (
                        /* Idle state — explain the system */
                        <div className="glass-card p-6 h-full space-y-6">
                            <h2 className="font-bold text-white text-lg">How SECP Protects You</h2>
                            <p className="text-sm text-[#a1a1c4]">
                                Press <strong className="text-red-400">Simulate Crash</strong> to see this play out live. Here's what will happen:
                            </p>
                            {STORY_STEPS.map((s, i) => (
                                <div key={s.id} className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                                        style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">{s.title}</p>
                                        <p className="text-xs text-[#a1a1c4] mt-0.5 leading-relaxed">{s.plain}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="rounded-xl p-4 text-xs text-[#a1a1c4] leading-relaxed"
                                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                                💡 <strong className="text-white">Unlike traditional DeFi</strong> which immediately liquidates your position,
                                SECP uses its Anti-Liquidation system to give you time to recover — protecting your collateral even during extreme market events.
                            </div>
                        </div>
                    ) : (
                        /* Active crash — animated story */
                        <div className="space-y-3">
                            {STORY_STEPS.map((s, i) => {
                                const visible = activeStep >= i;
                                const active = activeStep === i;
                                const done = activeStep > i;
                                return (
                                    <div key={s.id}
                                        className="glass-card p-5 transition-all duration-500"
                                        style={{
                                            opacity: visible ? 1 : 0,
                                            transform: visible ? 'translateY(0)' : 'translateY(16px)',
                                            borderColor: visible ? `${s.color}40` : 'rgba(255,255,255,0.08)',
                                            background: visible ? `${s.color}08` : 'var(--bg-card)',
                                        }}>
                                        <div className="flex items-start gap-4">
                                            {/* Step number / icon */}
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }}>
                                                {done
                                                    ? <Check className="w-5 h-5" style={{ color: '#22c55e' }} />
                                                    : active
                                                        ? <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: s.color }}><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                        : <s.icon className="w-5 h-5" style={{ color: s.color }} />
                                                }
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: s.color }}>
                                                        Step {i + 1}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: `${s.color}15`, color: s.color }}>
                                                        {s.contract}
                                                    </span>
                                                    {active && <span className="text-xs font-semibold animate-pulse" style={{ color: s.color }}>● RUNNING</span>}
                                                    {done && <span className="text-xs font-semibold text-green-400">✓ DONE</span>}
                                                </div>

                                                <p className="font-bold text-white mt-1">{s.title}</p>

                                                {/* Plain English */}
                                                <p className="text-sm text-[#a1a1c4] mt-1 leading-relaxed">{s.plain}</p>

                                                {/* Technical detail (show when visible) */}
                                                {visible && (
                                                    <div className="mt-2 rounded-lg px-3 py-2 font-mono text-xs"
                                                        style={{ background: 'rgba(0,0,0,0.3)', color: '#818cf8' }}>
                                                        {s.technical}
                                                    </div>
                                                )}

                                                {/* Specific metrics for relevant steps */}
                                                {visible && s.id === 'health' && hasPosition && debtN > 0 && (
                                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                                        <div className="rounded-lg p-2 text-xs" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                            <p className="text-[#6b6b8a]">Old HF</p>
                                                            <p className="font-bold text-white">{oldHF === Infinity ? '∞' : oldHF.toFixed(2)}</p>
                                                        </div>
                                                        <div className="rounded-lg p-2 text-xs" style={{ background: 'rgba(239,68,68,0.1)' }}>
                                                            <p className="text-[#6b6b8a]">New HF</p>
                                                            <p className="font-bold text-red-400">{newHF === Infinity ? '∞' : newHF.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {visible && s.id === 'mode' && (
                                                    <div className="mt-2 flex items-center gap-3 text-sm">
                                                        <span className="text-[#6b6b8a] text-xs">New mode:</span>
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold"
                                                            style={{ background: `${modeColor}20`, color: modeColor, border: `1px solid ${modeColor}40` }}>
                                                            {newMode === 'Freeze' ? '🔴' : newMode === 'Conservative' ? '🟡' : '🟢'} {newMode}
                                                        </span>
                                                    </div>
                                                )}

                                                {visible && s.id === 'protect' && (
                                                    <div className="mt-2 rounded-lg p-3 text-xs space-y-1"
                                                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                        <p className="text-indigo-300 font-semibold">✅ Your collateral is safe. No forced liquidation.</p>
                                                        <p className="text-[#a1a1c4]">Yield earnings are being automatically used to pay down your loan, buying time for market recovery.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Final summary */}
                            {crashed && activeStep >= STORY_STEPS.length - 1 && (
                                <div className="glass-card p-5"
                                    style={{ borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.06)' }}>
                                    <p className="font-bold text-white mb-2 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-indigo-400" /> SECP Protection Summary
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="flex items-start gap-2">
                                            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-[#a1a1c4]">No immediate liquidation — slow repayment instead</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-[#a1a1c4]">Vault frozen to prevent further exposure</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-[#a1a1c4]">Yield automatically repays debt over time</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-[#a1a1c4]">Borrower score preserved — not penalized for crash</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
