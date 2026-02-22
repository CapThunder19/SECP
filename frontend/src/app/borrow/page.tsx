'use client';

import { useState } from 'react';
import { useBorrow, useRepay } from '@/hooks/useProtocolActions';
import { useDebt, useMaxBorrow, useTokenBalance } from '@/hooks/useProtocolData';
import { CONTRACTS } from '@/config/contracts';
import { Check, AlertCircle, Info, Landmark, RefreshCcw } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const DURATIONS = [7, 14, 30, 90, 180, 365];

function formatErr(msg: string): string {
    if (!msg) return '';
    if (msg.includes('User rejected') || msg.includes('User denied')) return 'Transaction cancelled.';
    if (msg.includes('base fee') || msg.includes('underpriced')) return 'Gas estimate off — please retry.';
    if (msg.includes('Active loan')) return 'You already have an active loan. Repay it fully before borrowing again.';
    if (msg.includes('Invalid amount')) return 'Enter a valid borrow amount.';
    if (msg.length > 140) return msg.slice(0, 140) + '…';
    return msg;
}

import { Card, Button, Badge, MotionCard } from '@/components/ui';
import Link from 'next/link';

export default function BorrowPage() {
    const { isConnected } = useAccount();

    const [borrowAmt, setBorrowAmt] = useState('');
    const [duration, setDuration] = useState('30');
    const [repayAmt, setRepayAmt] = useState('');

    const { borrow, isPending: borrowPending, isSuccess: borrowOk, error: borrowErr } = useBorrow();
    const { repay, isPending: repayPending, isSuccess: repayOk, error: repayErr } = useRepay();

    const { maxBorrow, isLoading: maxL } = useMaxBorrow();
    const { debt, isLoading: debtL } = useDebt();
    const { balance: usdcBal } = useTokenBalance(CONTRACTS.mockUSDC as `0x${string}`);

    if (!isConnected) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8 text-center">
                <div className="w-24 h-24 border-2 border-black rounded-3xl flex items-center justify-center bg-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                    <Landmark className="w-10 h-10 text-white" />
                </div>
                <div>
                    <h1 className="text-4xl font-black mb-3 uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>Connect Wallet</h1>
                    <p className="max-w-md mx-auto font-medium text-neutral-500">
                        Connect to Arbitrum Sepolia to borrow USDC against your collateral.
                    </p>
                </div>
                <ConnectButton />
            </div>
        );
    }

    const maxN = parseFloat(maxBorrow);
    const debtN = parseFloat(debt);
    const avail = Math.max(0, maxN - debtN);
    const borrowN = parseFloat(borrowAmt || '0');
    const repayN = parseFloat(repayAmt || '0');
    const est5 = borrowN * 0.05 * (parseInt(duration || '0') / 365);

    return (
        <div className="max-w-2xl mx-auto space-y-12">

            {/* Header */}
            <div className="border-b-2 border-black pb-8">
                <h1 className="text-5xl font-black uppercase tracking-tighter flex items-center gap-4" style={{ color: 'var(--text-primary)' }}>
                    <Landmark className="w-10 h-10" /> Borrow
                </h1>
                <p className="font-medium mt-1 text-neutral-400">Borrow USDC against your collateral, repay at any time.</p>
            </div>

            {/* Position summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Max Borrow', val: maxL ? '…' : `$${maxN.toFixed(4)}` },
                    { label: 'Current Debt', val: debtL ? '…' : `$${debtN.toFixed(4)}`, highlight: debtN > 0 },
                    { label: 'Available', val: `$${avail.toFixed(4)}` },
                ].map(({ label, val, highlight }) => (
                    <div key={label} className="p-6 border-2 border-black rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-neutral-400 group-hover:text-black transition-colors">{label}</p>
                        <p className={`text-2xl font-black tracking-tighter ${highlight ? 'text-red-500' : 'text-black'}`}>{val}</p>
                    </div>
                ))}
            </div>

            {/* ── BORROW CARD ──────────────────────────────────── */}
            <Card className="p-8 space-y-8">
                <h2 className="text-2xl font-black uppercase tracking-tight">Borrow USDC</h2>

                {debtN > 0 && (
                    <div className="flex items-start gap-4 rounded-2xl p-6 bg-yellow-50 border-2 border-yellow-500 shadow-[4px_4px_0px_0px_rgba(245,158,11,0.2)] text-yellow-700">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <p className="text-xs font-bold leading-relaxed">
                            ACTIVE LOAN DETECTED: <strong>${debtN.toFixed(4)} USDC</strong>.
                            <br />You must repay it fully before borrowing again.
                        </p>
                    </div>
                )}

                {/* Amount */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Borrow Amount (USDC)</label>
                    <div className="relative">
                        <input type="number" min="0"
                            className="w-full p-6 border-2 border-black rounded-2xl font-black text-2xl tracking-tighter outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow pr-24"
                            placeholder="0.00"
                            value={borrowAmt}
                            onChange={(e) => setBorrowAmt(e.target.value)}
                            disabled={debtN > 0 || borrowPending}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBorrowAmt(avail.toFixed(4))}
                            disabled={debtN > 0}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 font-black">
                            MAX
                        </Button>
                    </div>
                </div>

                {/* Duration */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Loan Duration</label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {DURATIONS.map((d) => (
                            <button key={d}
                                onClick={() => setDuration(String(d))}
                                disabled={debtN > 0}
                                className={`py-3 text-xs rounded-xl font-black uppercase border-2 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${duration === String(d) ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-neutral-50'
                                    }`}>
                                {d}D
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <input type="number" min="1" max="365"
                            className="w-full p-4 border-2 border-black rounded-xl font-black text-sm tracking-widest uppercase outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                            placeholder="Custom days (1-365)"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            disabled={debtN > 0}
                        />
                    </div>
                </div>

                {/* Summary */}
                {borrowN > 0 && (
                    <div className="rounded-2xl p-6 space-y-3 bg-neutral-50 border-2 border-dashed border-black/20 text-[10px] font-black uppercase tracking-widest">
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Borrow Principal</span>
                            <span className="text-black">${borrowN.toFixed(4)} USDC</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Est. Interest (5% APR)</span>
                            <span className="text-black">${est5.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between border-t border-black/10 pt-3 text-xs tracking-tighter">
                            <span className="text-neutral-400">Total Obligation</span>
                            <span className="text-black text-lg">${(borrowN + est5).toFixed(4)}</span>
                        </div>
                    </div>
                )}

                {/* Status messages */}
                <div className="space-y-4">
                    {borrowPending && (
                        <div className="flex items-center gap-4 rounded-2xl p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="spinner border-black border-t-transparent" />
                            <p className="text-sm font-black uppercase tracking-widest">Confirming on-chain…</p>
                        </div>
                    )}

                    {borrowErr && (
                        <div className="flex items-start gap-4 rounded-2xl p-6 bg-red-50 border-2 border-red-500 text-red-500 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.2)]">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-black uppercase tracking-widest">Borrow Failed</p>
                                <p className="text-[10px] font-bold mt-1 opacity-80">{formatErr((borrowErr as any).message ?? '')}</p>
                            </div>
                        </div>
                    )}

                    {borrowOk && (
                        <div className="flex items-center gap-4 rounded-2xl p-6 bg-green-50 border-2 border-green-500 text-green-500 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.2)]">
                            <Check className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-black uppercase tracking-widest">Transaction Confirmed!</p>
                        </div>
                    )}
                </div>

                <Button
                    onClick={() => { borrow(borrowAmt, parseInt(duration)); setBorrowAmt(''); }}
                    disabled={!borrowAmt || borrowN <= 0 || borrowN > avail || !duration || parseInt(duration) <= 0 || borrowPending || debtN > 0}
                    size="lg"
                    className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    {borrowPending ? '⏳ BORROWING…'
                        : debtN > 0 ? '⚠️ REPAY DEBT FIRST'
                            : avail <= 0 ? '🏦 DEPOSIT ASSETS'
                                : '↗ BORROW USDC'}
                </Button>

                {avail <= 0 && debtN === 0 && (
                    <p className="text-center text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        No collateral deposited. <Link href="/deposit" className="text-black underline underline-offset-4">DEPOSIT FIRST</Link>
                    </p>
                )}
            </Card>

            {/* ── REPAY CARD ──────────────────────────────────── */}
            {debtN > 0 && (
                <Card className="p-8 space-y-8">
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                        <RefreshCcw className="w-6 h-6" /> Repay Debt
                    </h2>

                    <div className="flex justify-between items-center p-6 bg-red-50 border-2 border-red-500 rounded-2xl shadow-[4px_4px_0px_0px_rgba(239,68,68,0.1)]">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-1">Outstanding Obligation</p>
                            <p className="text-3xl font-black tracking-tight text-red-600">${debtN.toFixed(4)} USDC</p>
                        </div>
                        <Badge variant="destructive" className="px-4 py-2 uppercase font-black">ACTIVE DEBT</Badge>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Repay Amount</label>
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                USDC Bal: <span className="text-black font-black">{parseFloat(usdcBal).toFixed(4)}</span>
                            </span>
                        </div>
                        <div className="relative">
                            <input type="number" min="0"
                                className="w-full p-6 border-2 border-black rounded-2xl font-black text-2xl tracking-tighter outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow pr-24"
                                placeholder="0.00"
                                value={repayAmt}
                                onChange={(e) => setRepayAmt(e.target.value)}
                                disabled={repayPending}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRepayAmt(debt)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 font-black">
                                FULL
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {repayPending && (
                            <div className="flex items-center gap-4 rounded-2xl p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="spinner border-black border-t-transparent" />
                                <p className="text-sm font-black uppercase tracking-widest">Repayment Processing…</p>
                            </div>
                        )}

                        {repayErr && (
                            <div className="flex items-start gap-4 rounded-2xl p-6 bg-red-50 border-2 border-red-500 text-red-500 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.2)]">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-[10px] font-bold opacity-80">{formatErr((repayErr as any).message ?? '')}</p>
                            </div>
                        )}

                        {repayOk && (
                            <div className="flex items-center gap-4 rounded-2xl p-6 bg-green-50 border-2 border-green-500 text-green-500 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.2)]">
                                <Check className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-black uppercase tracking-widest">Repayment Done!</p>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={() => repay(repayAmt)}
                        disabled={!repayAmt || repayN <= 0 || repayN > debtN || repayPending}
                        variant="destructive"
                        size="lg"
                        className="w-full h-16 font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(239,68,68,0.3)] hover:shadow-none translate-x-1 translate-y-1">
                        {repayPending ? '⏳ REPAYING…' : '↙ REPAY USDC'}
                    </Button>
                </Card>
            )}
        </div>
    );
}
