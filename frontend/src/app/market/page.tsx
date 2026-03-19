'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useReadContract, useWriteContract, usePublicClient, useAccount, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { getContractsForChain } from '@/config/contracts';
import { useCollateralValue, useDebt } from '@/hooks/useProtocolData';
import {
    TrendingDown, Activity, Zap, RefreshCw, Shield, AlertTriangle,
    BarChart2, Flame, Check, ChevronRight, Lock, Shuffle, BarChart,
    DollarSign, Database, ArrowRight, Droplets
} from 'lucide-react';
import { Card, Button, Badge, MotionCard } from '@/components/ui';
import Link from 'next/link';
import { ProtocolFlow } from '@/components/dashboard/ProtocolFlow';

/* ── ABIs ──────────────────────────────────────── */
const ORACLE_ABI = [
    { name: 'getPrice', type: 'function', inputs: [{ name: 'token', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
    { name: 'marketVolatility', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
    { name: 'simulateCrash', type: 'function', inputs: [{ name: 'tokens', type: 'address[]' }, { name: 'dropPercent', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
    { name: 'setPrice', type: 'function', inputs: [{ name: 'token', type: 'address' }, { name: 'price', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
    { name: 'setVolatility', type: 'function', inputs: [{ name: 'vol', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
] as const;

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

// Generate OHLC candlestick data
interface CandleData { open: number; high: number; low: number; close: number; }
function genCandleHistory(base: number, seed: number, count: number = 50, crashProgress: number = 0, crashDrop: number = 0): CandleData[] {
    const candles: CandleData[] = [];
    let price = base;
    
    // Calculate how many candles are in "normal" state vs "crashing"
    const normalCount = count - Math.floor(crashProgress * 2);
    
    for (let i = 0; i < count; i++) {
        const open = price;
        
        // Increased volatility for more dramatic price swings
        const volatility = 0.015 + Math.abs(Math.sin(seed + i * 0.5)) * 0.04;
        const trend = Math.sin((seed + i) * 0.15) * 0.01; // Add trending behavior
        
        // Apply crash effect to later candles
        let change = (Math.sin(seed + i * 0.7 + 1.5) * volatility) + trend;
        if (i >= normalCount && crashProgress > 0) {
            const crashIntensity = ((i - normalCount) / (count - normalCount)) * crashDrop;
            change -= crashIntensity;
        }
        
        const close = open * (1 + change);
        
        // Wicks can extend further for realistic candles
        const wickRange = Math.abs(open - close) * (1 + Math.random() * 1.5);
        const high = Math.max(open, close) + wickRange * Math.abs(Math.sin(seed + i * 1.2)) * 0.4;
        const low = Math.min(open, close) - wickRange * Math.abs(Math.cos(seed + i * 1.1)) * 0.4;
        
        candles.push({ open, high, low, close });
        price = close;
    }
    return candles;
}

// Calculate Simple Moving Average
function calculateSMA(candles: CandleData[], period: number): number[] {
    const sma: number[] = [];
    for (let i = 0; i < candles.length; i++) {
        if (i < period - 1) {
            // For initial values, use exponential backfill
            const available = candles.slice(0, i + 1);
            const sum = available.reduce((acc, c) => acc + c.close, 0);
            sma.push(sum / available.length);
        } else {
            const sum = candles.slice(i - period + 1, i + 1).reduce((acc, c) => acc + c.close, 0);
            sma.push(sum / period);
        }
    }
    return sma;
}

// Smooth path generator for curves
function smoothCurvePath(points: [number, number][]): string {
    if (points.length < 2) return '';
    
    let path = `M ${points[0][0]},${points[0][1]}`;
    
    for (let i = 0; i < points.length - 1; i++) {
        const next = points[i + 1];
        path += ` L ${next[0]},${next[1]}`;
    }
    
    return path;
}

function smooth(pts: [number, number][]): string {
    if (pts.length < 2) return '';
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        d += ` L${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
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

/* ── Price Chart Components ─────────────────────────────────── */
type ChartType = 'line' | 'candlestick' | 'bar' | 'area';

// Candlestick Chart
function CandlestickChart({ 
    tokenKey, 
    color, 
    crashed, 
    candleData 
}: { 
    tokenKey: string;
    color: string;
    crashed: boolean;
    candleData: CandleData[];
}) {
    const W = 1000, H = 400; // Much larger canvas
    const count = candleData.length || 50;
    const candleWidth = Math.max(6, (W - 100) / count * 0.7); // Wider candles
    const wickWidth = 2;
    
    // Get all values for scaling
    const allValues = candleData.flatMap(c => [c.high, c.low]);
    const min = Math.min(...allValues) * 0.985;
    const max = Math.max(...allValues) * 1.015;
    const rng = max - min || 0.001;
    
    const priceToY = (price: number) => H - 20 - ((price - min) / rng) * (H - 50);
    
    // Calculate price labels
    const priceLevels = [0.2, 0.4, 0.6, 0.8].map(r => min + rng * r);
    
    // Calculate moving averages
    const sma7 = calculateSMA(candleData, 7);
    const sma20 = calculateSMA(candleData, 20);
    
    const sma7Points: [number, number][] = sma7.map((val, i) => [
        50 + (i / (count - 1)) * (W - 100),
        priceToY(val)
    ]);
    
    const sma20Points: [number, number][] = sma20.map((val, i) => [
        50 + (i / (count - 1)) * (W - 100),
        priceToY(val)
    ]);
    
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border-2" 
            style={{ height: 400, background: 'hsl(var(--card))', borderColor: 'var(--border-strong)' }}>
            {/* Grid lines with price labels */}
            {priceLevels.map((price, idx) => {
                const y = priceToY(price);
                return (
                    <g key={idx}>
                        <line x1="50" y1={y} x2={W - 20} y2={y} 
                            stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
                        <text x="15" y={y + 4} fill="var(--text-secondary)" fontSize="11" fontWeight="600">
                            ${price.toFixed(3)}
                        </text>
                    </g>
                );
            })}
            
            {crashed && (
                <rect x="0" y="0" width={W} height={H} fill="rgba(239,68,68,0.08)" />
            )}
            
            {/* Draw candlesticks */}
            <g opacity={0.95}>
                {candleData.map((candle, i) => {
                    const x = 50 + (i / (count - 1)) * (W - 100);
                    const isUp = candle.close >= candle.open;
                    const bodyTop = priceToY(Math.max(candle.open, candle.close));
                    const bodyBottom = priceToY(Math.min(candle.open, candle.close));
                    const bodyHeight = Math.max(2, bodyBottom - bodyTop);
                    
                    return (
                        <g key={i}>
                            {/* Wick */}
                            <line 
                                x1={x} y1={priceToY(candle.high)} 
                                x2={x} y2={priceToY(candle.low)}
                                stroke={isUp ? '#22c55e' : '#ef4444'}
                                strokeWidth={wickWidth}
                                opacity={0.8}
                            />
                            {/* Body */}
                            <rect
                                x={x - candleWidth / 2}
                                y={bodyTop}
                                width={candleWidth}
                                height={bodyHeight}
                                fill={isUp ? '#22c55e' : '#ef4444'}
                                stroke={isUp ? '#16a34a' : '#dc2626'}
                                strokeWidth="1"
                                opacity={0.95}
                            />
                        </g>
                    );
                })}
            </g>
            
            {/* Draw moving average curves */}
            <g>
                {/* SMA20 - slower white line */}
                <path
                    d={smoothCurvePath(sma20Points)}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.5}
                    style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.3))' }}
                />
                {/* SMA7 - faster colored line with glow */}
                <path
                    d={smoothCurvePath(sma7Points)}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.95}
                    style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                />
            </g>
            
            {/* Time labels */}
            {['−40m', '−30m', '−20m', '−10m', 'Now'].map((l, i, a) => 
                <text key={l} x={50 + (i / (a.length - 1)) * (W - 100)} y={H - 5} 
                    textAnchor="middle" fill="var(--ink)" fontSize="11" 
                    fontWeight="900" className="uppercase tracking-widest">{l}</text>
            )}
        </svg>
    );
}

// Bar Chart
function PriceBarChart({ sets, crashed }: { sets: { key: string; data: number[]; color: string }[]; crashed: boolean }) {
    const W = 1000, H = 400;
    const dataLength = sets[0]?.data.length || 40;
    const barWidth = (W - 100) / dataLength * 0.8;
    
    const allValues = sets.flatMap(s => s.data);
    const min = Math.min(...allValues) * 0.97;
    const max = Math.max(...allValues) * 1.03;
    const rng = max - min || 0.001;
    
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border-2" style={{ height: 400, background: 'hsl(var(--card))', borderColor: 'var(--border-strong)' }}>
            {[0.25, 0.5, 0.75].map(r => <line key={r} x1="50" y1={r * H} x2={W - 20} y2={r * H} stroke="hsl(var(--border))" strokeWidth="1" opacity="0.3" strokeDasharray="5,5" />)}
            {crashed && <rect x="0" y="0" width={W} height={H} fill="rgba(239,68,68,0.08)" />}
            
            {sets.map(({ key, data, color }, setIdx) => {
                const offset = (setIdx - (sets.length - 1) / 2) * barWidth / sets.length;
                return (
                    <g key={key}>
                        {data.map((value, i) => {
                            const x = 50 + (i / (dataLength - 1)) * (W - 100) + offset;
                            const barHeight = ((value - min) / rng) * (H - 50);
                            const y = H - 20 - barHeight;
                            
                            return (
                                <rect
                                    key={i}
                                    x={x - barWidth / (sets.length * 2)}
                                    y={y}
                                    width={barWidth / sets.length}
                                    height={Math.max(2, barHeight)}
                                    fill={color}
                                    stroke="var(--border-strong)"
                                    strokeWidth="1"
                                    opacity={0.85}
                                />
                            );
                        })}
                    </g>
                );
            })}
            
            {['−40m', '−30m', '−20m', '−10m', 'Now'].map((l, i, a) => 
                <text key={l} x={50 + (i / (a.length - 1)) * (W - 100)} y={H - 5} textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="900" className="uppercase tracking-widest">{l}</text>
            )}
        </svg>
    );
}

// Area Chart
function AreaChart({ sets, crashed }: { sets: { key: string; data: number[]; color: string }[]; crashed: boolean }) {
    const W = 1000, H = 400;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border-2" style={{ height: 400, background: 'hsl(var(--card))', borderColor: 'var(--border-strong)' }}>
            {[0.25, 0.5, 0.75].map(r => <line key={r} x1="50" y1={r * H} x2={W - 20} y2={r * H} stroke="hsl(var(--border))" strokeWidth="1" opacity="0.3" strokeDasharray="5,5" />)}
            {crashed && <rect x="0" y="0" width={W} height={H} fill="rgba(239,68,68,0.08)" />}
            
            {sets.map(({ key, data, color }) => {
                const pts = toPts(data, W, H);
                const adjustedPts: [number, number][] = pts.map(([x, y]) => [50 + (x / W) * (W - 100), y]);
                return (
                    <g key={key}>
                        <path d={area(adjustedPts, H)} fill={color} opacity="0.2" />
                        <path d={smooth(adjustedPts)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
                    </g>
                );
            })}
            
            {sets.map(({ key, data, color }) => { 
                const pts = toPts(data, W, H);
                const adjustedPts: [number, number][] = pts.map(([x, y]) => [50 + (x / W) * (W - 100), y]);
                const [lx, ly] = adjustedPts[adjustedPts.length - 1]; 
                return <g key={`d-${key}`}><circle cx={lx} cy={ly} r="6" fill="var(--border-strong)" /><circle cx={lx} cy={ly} r="4" fill={color} /></g>; 
            })}
            
            {['−40m', '−30m', '−20m', '−10m', 'Now'].map((l, i, a) => 
                <text key={l} x={50 + (i / (a.length - 1)) * (W - 100)} y={H - 5} textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="900" className="uppercase tracking-widest">{l}</text>
            )}
        </svg>
    );
}

// Line Chart (original)
function LineChart({ sets, crashed }: { sets: { key: string; data: number[]; color: string }[]; crashed: boolean }) {
    const W = 1000, H = 400;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border-2" style={{ height: 400, background: 'hsl(var(--card))', borderColor: 'var(--border-strong)' }}>
            {[0.25, 0.5, 0.75].map(r => <line key={r} x1="50" y1={r * H} x2={W - 20} y2={r * H} stroke="hsl(var(--border))" strokeWidth="1" opacity="0.3" strokeDasharray="5,5" />)}
            {crashed && <rect x="0" y="0" width={W} height={H} fill="rgba(239,68,68,0.08)" />}
            {sets.map(({ key, data, color }) => {
                const pts = toPts(data, W, H);
                const adjustedPts: [number, number][] = pts.map(([x, y]) => [50 + (x / W) * (W - 100), y]);
                return (<g key={key}><path d={smooth(adjustedPts)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" /></g>);
            })}
            {sets.map(({ key, data, color }) => { 
                const pts = toPts(data, W, H); 
                const adjustedPts: [number, number][] = pts.map(([x, y]) => [50 + (x / W) * (W - 100), y]);
                const [lx, ly] = adjustedPts[adjustedPts.length - 1]; 
                return <g key={`d-${key}`}><circle cx={lx} cy={ly} r="6" fill="var(--border-strong)" /><circle cx={lx} cy={ly} r="4" fill={color} /></g>; 
            })}
            {['−40m', '−30m', '−20m', '−10m', 'Now'].map((l, i, a) => <text key={l} x={50 + (i / (a.length - 1)) * (W - 100)} y={H - 5} textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="900" className="uppercase tracking-widest">{l}</text>)}
        </svg>
    );
}

// Main Price Chart with type selector
function PriceChart({ 
    sets, 
    crashed, 
    chartType,
    candleData,
    selectedToken
}: { 
    sets: { key: string; data: number[]; color: string }[]; 
    crashed: boolean;
    chartType: ChartType;
    candleData: Record<string, CandleData[]>;
    selectedToken: string;
}) {
    if (chartType === 'candlestick') {
        const tokenConfig = {
            mDOT: { color: '#e91e8c' },
            mWBTC: { color: '#f7931a' },
            mYLD: { color: '#f59e0b' },
            mRWA: { color: '#6366f1' },
        }[selectedToken as 'mDOT' | 'mWBTC' | 'mYLD' | 'mRWA'] || { color: '#e91e8c' };
        
        return <CandlestickChart 
            tokenKey={selectedToken} 
            color={tokenConfig.color}
            crashed={crashed} 
            candleData={candleData[selectedToken] || []} 
        />;
    }
    
    switch (chartType) {
        case 'bar':
            return <PriceBarChart sets={sets} crashed={crashed} />;
        case 'area':
            return <AreaChart sets={sets} crashed={crashed} />;
        case 'line':
        default:
            return <LineChart sets={sets} crashed={crashed} />;
    }
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
const BASE = { mDOT: 6.0, mWBTC: 60000.0, mYLD: 1.05, mRWA: 1.5 };

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
    const [chartType, setChartType] = useState<ChartType>('line');
    const crashInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

    const chainId = useChainId();
    const contracts = getContractsForChain(chainId);
    const ORACLE = contracts.mockOracle as `0x${string}`;

    /* Oracle reads */
    const { data: pDOT, refetch: rDOT } = useReadContract({ address: ORACLE, abi: ORACLE_ABI, functionName: 'getPrice', args: [contracts.mockDOT as `0x${string}`], query: { refetchInterval: 5000 } });
    const { data: pWBTC, refetch: rWBTC } = useReadContract({ address: ORACLE, abi: ORACLE_ABI, functionName: 'getPrice', args: [contracts.mockWBTC as `0x${string}`], query: { refetchInterval: 5000 } });
    const { data: pYD, refetch: rY } = useReadContract({ address: ORACLE, abi: ORACLE_ABI, functionName: 'getPrice', args: [contracts.mockYield as `0x${string}`], query: { refetchInterval: 5000 } });
    const { data: pRD, refetch: rR } = useReadContract({ address: ORACLE, abi: ORACLE_ABI, functionName: 'getPrice', args: [contracts.mockRWA as `0x${string}`], query: { refetchInterval: 5000 } });
    const { data: volD, refetch: rV } = useReadContract({ address: ORACLE, abi: ORACLE_ABI, functionName: 'marketVolatility', query: { refetchInterval: 5000 } });

    const pD = pDOT ? parseFloat(formatEther(pDOT as bigint)) : BASE.mDOT;
    const pW = pWBTC ? parseFloat(formatEther(pWBTC as bigint)) : BASE.mWBTC;
    const pY = pYD ? parseFloat(formatEther(pYD as bigint)) : BASE.mYLD;
    const pR = pRD ? parseFloat(formatEther(pRD as bigint)) : BASE.mRWA;
    const vol = Number(volD ?? 0n);

    // Store crash result
    const storeCrashResult = useCallback((crashIntensity: number, oldCol: number, newCol: number, oldHF: number, newHF: number) => {
        const crashResult = {
            timestamp: Date.now(),
            intensity: crashIntensity,
            collateralBefore: oldCol,
            collateralAfter: newCol,
            healthFactorBefore: oldHF,
            healthFactorAfter: newHF,
            tokens: { mDOT: pD, mWBTC: pW, mYLD: pY, mRWA: pR },
        };
        localStorage.setItem('lastCrashResult', JSON.stringify(crashResult));
    }, [pD, pW, pY, pR]);

    /* Chart data */
    const histBase = useMemo(() => ({ mDOT: genHistory(BASE.mDOT, 0), mWBTC: genHistory(BASE.mWBTC, 2), mYLD: genHistory(BASE.mYLD, 5), mRWA: genHistory(BASE.mRWA, 8) }), []);
    const scale = (h: number[], live: number) => { const l = h[h.length - 1]; return h.map(v => v * (live / l)); };

    const chartData = useMemo(() => {
        const drop = localDrop / 100;
        const tail = (live: number) => Array.from({ length: crashProgress }, (_, i) => {
            const e = 1 - Math.pow(1 - (i + 1) / 10, 2);
            return live * (1 - e * drop);
        });
        return {
            mDOT: [...scale(histBase.mDOT, pD), ...tail(pD)],
            mWBTC: [...scale(histBase.mWBTC, pW), ...tail(pW)],
            mYLD: [...scale(histBase.mYLD, pY), ...tail(pY)],
            mRWA: [...scale(histBase.mRWA, pR), ...tail(pR)],
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [crashProgress, localDrop, pD, pW, pY, pR]);

    const [selectedToken, setSelectedToken] = useState<'mDOT' | 'mWBTC' | 'mYLD' | 'mRWA'>('mDOT');
    
    // Generate candlestick data
    const candleData = useMemo(() => {
        const candleCount = 50; // More candles for detailed view
        const drop = localDrop / 100;
        
        return {
            mDOT: genCandleHistory(pD, 0, candleCount, crashProgress, drop),
            mWBTC: genCandleHistory(pW, 2, candleCount, crashProgress, drop),
            mYLD: genCandleHistory(pY, 5, candleCount, crashProgress, drop),
            mRWA: genCandleHistory(pR, 8, candleCount, crashProgress, drop),
        };
    }, [pD, pW, pY, pR, crashProgress, localDrop]);

    const chartSets = [
        { key: 'mDOT', data: chartData.mDOT, color: '#e91e8c' },
        { key: 'mWBTC', data: chartData.mWBTC, color: '#f7931a' },
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
        
        // Capture before state
        const colN = parseFloat(colValue);
        const debtN = parseFloat(debt);
        const oldHF = debtN > 0 ? colN * 85 / debtN : Infinity;
        
        setCrashState('crashing');
        setLocalDrop(intensity);
        setCrashProgress(0);
        setActiveStep(-1);
        stepTimers.current.forEach(clearTimeout);
        stepTimers.current = [];

        // Calculate after state
        const newCol = colN * (1 - intensity / 100);
        const newHF = debtN > 0 ? newCol * 85 / debtN : Infinity;
        
        // Store crash result
        storeCrashResult(intensity, colN, newCol, oldHF, newHF);

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

        // On-chain attempt (optional - simulation works regardless)
        if (isConnected) {
            setTxStatus('🎬 Running visual simulation...');
            // Try on-chain update, but don't block the visualization
            setTimeout(async () => {
                try {
                    const gasPrice = await safeGasPrice(publicClient);
                    const hash = await writeContractAsync({
                        address: ORACLE, abi: ORACLE_ABI, functionName: 'simulateCrash',
                        args: [[contracts.mockDOT, contracts.mockWBTC, contracts.mockYield, contracts.mockRWA].map(a => a as `0x${string}`), BigInt(intensity)],
                        gas: 200_000n, gasPrice,
                    });
                    await publicClient!.waitForTransactionReceipt({ hash, confirmations: 1 });
                    setOnChainOk(true);
                    setTxStatus(`✅ On-chain prices updated! (${hash.slice(0, 10)}…)`);
                    rDOT(); rWBTC(); rY(); rR(); rV();
                } catch (err: any) {
                    setOnChainOk(false);
                    const m = err?.message ?? '';
                    if (m.includes('not the owner') || m.includes('Ownable') || m.includes('owner')) {
                        setTxStatus('ℹ️ Visual simulation complete (contract owner only for on-chain updates)');
                    } else if (m.includes('User rejected') || m.includes('denied')) {
                        setTxStatus('ℹ️ Visual simulation complete (transaction cancelled)');
                    } else {
                        setTxStatus('ℹ️ Visual simulation complete (on-chain update unavailable)');
                    }
                }
            }, 500); // Delay to let simulation start first
        } else {
            setOnChainOk(false);
            setTxStatus('🎬 Visual simulation mode (wallet not connected)');
        }
    }, [crashState, intensity, isConnected, publicClient, writeContractAsync, rDOT, rWBTC, rY, rR, rV, colValue, debt, storeCrashResult]);

    const handleReset = useCallback(async () => {
        if (crashInterval.current) clearInterval(crashInterval.current);
        stepTimers.current.forEach(clearTimeout);
        setCrashState('resetting');
        setLocalDrop(0); setCrashProgress(0); setActiveStep(-1); setTxStatus('');

        if (isConnected && onChainOk) {
            try {
                const gasPrice = await safeGasPrice(publicClient);
                for (const [a, p] of [[contracts.mockDOT, parseEther('6')], [contracts.mockWBTC, parseEther('60000')], [contracts.mockYield, parseEther('1.05')], [contracts.mockRWA, parseEther('1.5')]] as const) {
                    const h = await writeContractAsync({ address: ORACLE, abi: ORACLE_ABI, functionName: 'setPrice', args: [a as `0x${string}`, p], gas: 80_000n, gasPrice });
                    await publicClient!.waitForTransactionReceipt({ hash: h, confirmations: 1 });
                }
                const h2 = await writeContractAsync({ address: ORACLE, abi: ORACLE_ABI, functionName: 'setVolatility', args: [20n], gas: 60_000n, gasPrice });
                await publicClient!.waitForTransactionReceipt({ hash: h2, confirmations: 1 });
                rDOT(); rWBTC(); rY(); rR(); rV();
            } catch { /* UI reset only */ }
        }
        setOnChainOk(null);
        setCrashState('idle');
        setTxStatus('');
    }, [isConnected, onChainOk, publicClient, writeContractAsync, rDOT, rWBTC, rY, rR, rV]);

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
                        Visual simulation tool — Demo works for all users (on-chain updates require contract ownership)
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <Badge variant="conf" className="px-6 py-2 uppercase font-black tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4" /> {crashed ? 'Crashed' : 'Live'} Simulator
                    </Badge>
                    {onChainOk === true && <Badge variant="success" className="px-4 py-2 text-xs">✅ On-Chain</Badge>}
                    {onChainOk === false && crashed && <Badge variant="outline" className="px-4 py-2 text-xs">🎬 Simulation</Badge>}
                </div>
            </div>

            {/* Price cards + volatility */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {[
                    { sym: 'mDOT', live: pD, color: '#e91e8c' },
                    { sym: 'mWBTC', live: pW, color: '#f7931a' },
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
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        <BarChart2 className="w-8 h-8" /> Price Feed
                    </h2>
                    
                    {/* Chart Type Selector */}
                    <div className="flex items-center gap-2 border-2 rounded-xl p-1" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--muted))' }}>
                        {[
                            { type: 'line' as ChartType, icon: Activity, label: 'Line' },
                            { type: 'candlestick' as ChartType, icon: BarChart, label: 'Candle' },
                            { type: 'bar' as ChartType, icon: BarChart2, label: 'Bar' },
                            { type: 'area' as ChartType, icon: TrendingDown, label: 'Area' },
                        ].map(({ type, icon: Icon, label }) => (
                            <button
                                key={type}
                                onClick={() => setChartType(type)}
                                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    chartType === type 
                                        ? 'shadow-[3px_3px_0px_0px_rgba(var(--ink-rgb),1)]' 
                                        : 'hover:bg-white/50'
                                }`}
                                style={{
                                    background: chartType === type ? 'hsl(var(--card))' : 'transparent',
                                    borderWidth: chartType === type ? '2px' : '0',
                                    borderColor: 'var(--border-strong)',
                                    color: chartType === type ? 'hsl(var(--foreground))' : 'var(--text-secondary)',
                                }}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Token Selector for Candlestick */}
                {chartType === 'candlestick' && (
                    <div className="mb-6 flex items-center gap-4">
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Select Token:</span>
                        <div className="flex items-center gap-2 border-2 rounded-xl p-1" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--muted))' }}>
                            {[
                                { key: 'mDOT' as const, color: '#e91e8c', label: 'mDOT' },
                                { key: 'mWBTC' as const, color: '#f7931a', label: 'mWBTC' },
                                { key: 'mYLD' as const, color: '#f59e0b', label: 'mYLD' },
                                { key: 'mRWA' as const, color: '#6366f1', label: 'mRWA' },
                            ].map(({ key, color, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedToken(key)}
                                    className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                                        selectedToken === key 
                                            ? 'shadow-[3px_3px_0px_0px_rgba(var(--ink-rgb),1)]' 
                                            : 'hover:bg-white/50'
                                    }`}
                                    style={{
                                        background: selectedToken === key ? 'hsl(var(--card))' : 'transparent',
                                        borderWidth: selectedToken === key ? '2px' : '0',
                                        borderColor: 'var(--border-strong)',
                                        color: selectedToken === key ? 'hsl(var(--foreground))' : 'var(--text-secondary)',
                                    }}
                                >
                                    <div className="w-3 h-3 rounded-full border-2" style={{ background: color, borderColor: 'var(--border-strong)' }} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="flex items-center justify-end gap-4 mb-4">
                    {chartType !== 'candlestick' ? (
                        <>
                            {[['mDOT', '#e91e8c'], ['mWBTC', '#f7931a'], ['mYLD', '#f59e0b'], ['mRWA', '#6366f1']].map(([k, c]) => (
                                <div key={k} className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 rounded-full" style={{ background: c, borderColor: 'var(--border-strong)' }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{k}</span>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 rounded" style={{ background: '#ffffff', opacity: 0.5 }} />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>SMA20</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 rounded" style={{ 
                                    background: selectedToken === 'mDOT' ? '#e91e8c' : selectedToken === 'mWBTC' ? '#f7931a' : selectedToken === 'mYLD' ? '#f59e0b' : '#6366f1', 
                                    opacity: 0.95 
                                }} />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>SMA7</span>
                            </div>
                        </>
                    )}
                </div>
                
                <PriceChart sets={chartSets} crashed={crashed} chartType={chartType} candleData={candleData} selectedToken={selectedToken} />
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
                            <label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>Crash Intensity</label>
                            <div className="grid grid-cols-2 gap-3">
                                {CRASH_OPTS.map(p => (
                                    <button key={p} onClick={() => setIntensity(p)} disabled={crashState !== 'idle'}
                                        className={`p-4 rounded-2xl border-2 transition-all shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),0.8)] active:shadow-none active:translate-x-1 active:translate-y-1 ${intensity === p ? '' : ''}`}
                                        style={{
                                            borderColor: 'var(--border-strong)',
                                            background: intensity === p ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                                            color: intensity === p ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                                        }}>
                                        <p className="font-extrabold text-xl tracking-tighter">−{p}%</p>
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-70">
                                            {p <= 20 ? 'MILD' : p <= 40 ? 'MOD.' : p <= 60 ? 'SEVERE' : 'CRITICAL'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick preview */}
                        {crashState === 'idle' && hasPosition && debtN > 0 && (
                            <div className="rounded-2xl p-6 border-2 border-dashed space-y-3 font-black uppercase tracking-widest text-[10px]" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted))' }}>
                                <p className="text-[#ef4444] mb-2 font-black">Projected Impact:</p>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-secondary)' }} className="font-normal">Collateral</span>
                                    <span className="text-[#ef4444]">${colN.toFixed(2)} → ${newCol.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-secondary)' }} className="font-normal">Health Factor</span>
                                    <span className={newHF < 100 ? 'text-[#ef4444]' : 'text-amber-600'}>{oldHF === Infinity ? '∞' : oldHF.toFixed(2)} → {newHF === Infinity ? '∞' : newHF.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {txStatus && <p className="text-[10px] font-black uppercase tracking-widest border-2 p-4 rounded-xl" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}>{txStatus}</p>}

                        {/* Simulation Notice */}
                        {crashState === 'idle' && (
                            <div className="rounded-xl p-4 border-2 border-dashed" style={{ borderColor: 'hsl(var(--border) / 0.3)', background: 'hsl(var(--muted) / 0.5)' }}>
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                                    💡 This is a visual simulation tool. The crash animation works for all users. 
                                    {isConnected && ' On-chain price updates require contract ownership.'}
                                </p>
                            </div>
                        )}

                        <div className="space-y-4 pt-4">
                            <Button onClick={handleCrash} disabled={crashState !== 'idle'}
                                size="lg"
                                className="w-full h-16 font-extrabold uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(var(--ink-rgb),0.8)] bg-[#e65555] hover:bg-[#d44444] border-2 transition-all"
                                style={{ borderColor: 'var(--border-strong)' }}>
                                {crashing ? '⚡ CRASHING…' : crashed ? '🔥 MARKET DOWN' : `🔥 CRASH MARKET −${intensity}%`}
                            </Button>

                            {crashState !== 'idle' && (
                                <Button onClick={handleReset} disabled={crashState === 'resetting'}
                                    variant="outline"
                                    size="lg"
                                    className="w-full h-16 font-black uppercase tracking-widest border-2 shadow-[6px_6px_0px_0px_rgba(var(--ink-rgb),0.15)]"
                                    style={{ borderColor: 'var(--border-strong)' }}>
                                    <RefreshCw className="w-5 h-5 mr-2" /> RECOVERY MODE
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Protocol component status */}
                    {(crashing || crashed) && (
                        <Card className="p-8 space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-secondary)' }}>Protocol Response</p>
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
                            {/* Visual Protocol Flow Diagram */}
                            <Card className="p-8 border-2 shadow-[12px_12px_0px_0px_rgba(var(--ink-rgb),1)]" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}>
                                <div className="mb-6">
                                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Live Protocol Visualization</h2>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Watch how SECP automatically protects your position
                                    </p>
                                </div>
                                <ProtocolFlow step={activeStep} isActive={crashState === 'crashing' || crashState === 'crashed'} />
                            </Card>

                            {/* Step-by-step breakdown */}
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
