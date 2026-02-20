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
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 text-center">
                <Landmark className="w-12 h-12 text-green-400" />
                <h1 className="text-2xl font-bold text-white">Connect Wallet to Borrow</h1>
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
        <div className="max-w-2xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Landmark className="w-7 h-7 text-green-400" /> Borrow & Repay
                </h1>
                <p className="text-[#a1a1c4] mt-1">Borrow USDC against your collateral, repay at any time.</p>
            </div>

            {/* Position summary */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Max Borrow', val: maxL ? '…' : `$${maxN.toFixed(4)}`, color: '#a5b4fc' },
                    { label: 'Current Debt', val: debtL ? '…' : `$${debtN.toFixed(4)}`, color: debtN > 0 ? '#ef4444' : '#22c55e' },
                    { label: 'Available', val: `$${avail.toFixed(4)}`, color: '#22c55e' },
                ].map(({ label, val, color }) => (
                    <div key={label} className="glass-card p-4 text-center">
                        <p className="text-xs text-[#6b6b8a] mb-1">{label}</p>
                        <p className="text-lg font-bold" style={{ color }}>{val}</p>
                    </div>
                ))}
            </div>

            {/* ── BORROW CARD ──────────────────────────────────── */}
            <div className="glass-card p-6 space-y-5">
                <h2 className="font-bold text-white text-lg">Borrow USDC</h2>

                {debtN > 0 && (
                    <div className="flex items-start gap-3 rounded-xl p-4"
                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-300">
                            You have an active loan of <strong>${debtN.toFixed(4)} USDC</strong>.
                            Only one active loan is allowed — repay it below before borrowing again.
                        </p>
                    </div>
                )}

                {/* Amount */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-semibold text-[#a1a1c4]">Borrow Amount (USDC)</label>
                    </div>
                    <div className="relative">
                        <input type="number" min="0"
                            className="proto-input pr-20"
                            placeholder="0.00"
                            value={borrowAmt}
                            onChange={(e) => setBorrowAmt(e.target.value)}
                            disabled={debtN > 0 || borrowPending}
                        />
                        <button
                            onClick={() => setBorrowAmt(avail.toFixed(4))}
                            disabled={debtN > 0}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-1 rounded-md"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>
                            MAX
                        </button>
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <label className="text-sm font-semibold text-[#a1a1c4] block mb-2">Loan Duration (Days)</label>
                    <div className="grid grid-cols-6 gap-1.5 mb-2">
                        {DURATIONS.map((d) => (
                            <button key={d}
                                onClick={() => setDuration(String(d))}
                                disabled={debtN > 0}
                                className="py-2 text-xs rounded-lg font-semibold transition-all"
                                style={{
                                    background: duration === String(d) ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${duration === String(d) ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                    color: duration === String(d) ? '#86efac' : '#6b6b8a',
                                }}>
                                {d}d
                            </button>
                        ))}
                    </div>
                    <input type="number" min="1" max="365"
                        className="proto-input"
                        placeholder="Custom days"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        disabled={debtN > 0}
                    />
                </div>

                {/* Summary */}
                {borrowN > 0 && (
                    <div className="rounded-xl p-4 space-y-2"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex justify-between text-sm">
                            <span className="text-[#a1a1c4]">Borrow Amount</span>
                            <span className="text-white font-semibold">${borrowN.toFixed(4)} USDC</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[#a1a1c4]">Est. Interest (5% APR)</span>
                            <span className="text-white font-semibold">${est5.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <span className="text-white font-medium">Total to repay</span>
                            <span className="font-bold text-white">${(borrowN + est5).toFixed(4)}</span>
                        </div>
                    </div>
                )}

                {borrowN > 0 && debtN === 0 && (
                    <div className="flex items-start gap-2 text-xs rounded-lg p-3"
                        style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', color: '#86efac' }}>
                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        Borrowing requires 1 wallet confirmation — USDC is sent directly to your wallet.
                    </div>
                )}

                {borrowPending && (
                    <div className="flex items-center gap-3 rounded-xl p-4"
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                        <div className="spinner flex-shrink-0" />
                        <p className="text-sm font-semibold text-green-300">Borrowing… confirm in MetaMask</p>
                    </div>
                )}

                {borrowErr && (
                    <div className="flex items-start gap-3 rounded-xl p-4"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-300">Borrow Failed</p>
                            <p className="text-xs text-red-400/80 mt-0.5">{formatErr((borrowErr as any).message ?? '')}</p>
                        </div>
                    </div>
                )}

                {borrowOk && (
                    <div className="flex items-center gap-3 rounded-xl p-4"
                        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <p className="text-sm font-semibold text-green-300">Borrowed! USDC sent to your wallet.</p>
                    </div>
                )}

                <button
                    onClick={() => { borrow(borrowAmt, parseInt(duration)); setBorrowAmt(''); }}
                    disabled={!borrowAmt || borrowN <= 0 || borrowN > avail || !duration || parseInt(duration) <= 0 || borrowPending || debtN > 0}
                    className="btn-glow w-full py-3.5 rounded-xl font-semibold text-white text-sm"
                    style={(!borrowAmt || borrowN <= 0 || borrowN > avail || borrowPending || debtN > 0)
                        ? { opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none', transform: 'none' } : {}}>
                    {borrowPending ? '⏳ Borrowing…'
                        : debtN > 0 ? '⚠️ Repay Active Loan First'
                            : avail <= 0 ? '🏦 Deposit Collateral to Borrow'
                                : '↗ Borrow USDC'}
                </button>

                {avail <= 0 && debtN === 0 && (
                    <p className="text-center text-xs text-[#6b6b8a]">
                        No collateral deposited yet. Go to{' '}
                        <a href="/deposit" className="text-indigo-400 hover:underline">Deposit</a> first.
                    </p>
                )}
            </div>

            {/* ── REPAY CARD ──────────────────────────────────── */}
            {debtN > 0 && (
                <div className="glass-card p-6 space-y-5">
                    <h2 className="font-bold text-white text-lg flex items-center gap-2">
                        <RefreshCcw className="w-5 h-5 text-red-400" /> Repay Debt
                    </h2>

                    <div className="flex justify-between text-sm p-4 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <span className="text-[#a1a1c4]">Outstanding Debt</span>
                        <span className="font-bold text-red-400">${debtN.toFixed(4)} USDC</span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <label className="text-sm font-semibold text-[#a1a1c4]">Repay Amount</label>
                        <span className="text-xs text-[#6b6b8a]">
                            USDC Balance: <span className="text-white font-medium">{parseFloat(usdcBal).toFixed(4)}</span>
                        </span>
                    </div>

                    <div className="relative">
                        <input type="number" min="0"
                            className="proto-input pr-20"
                            placeholder="0.00"
                            value={repayAmt}
                            onChange={(e) => setRepayAmt(e.target.value)}
                            disabled={repayPending}
                        />
                        <button
                            onClick={() => setRepayAmt(debt)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-1 rounded-md"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                            FULL
                        </button>
                    </div>

                    <div className="flex items-start gap-2 text-xs rounded-lg p-3"
                        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        Repay needs 2 confirmations: (1) approve USDC spending → (2) repay loan.
                    </div>

                    {repayPending && (
                        <div className="flex items-center gap-3 rounded-xl p-4"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <div className="spinner flex-shrink-0" />
                            <p className="text-sm font-semibold text-red-300">Repaying… confirm in MetaMask</p>
                        </div>
                    )}

                    {repayErr && (
                        <div className="flex items-start gap-3 rounded-xl p-4"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-400/80">{formatErr((repayErr as any).message ?? '')}</p>
                        </div>
                    )}

                    {repayOk && (
                        <div className="flex items-center gap-3 rounded-xl p-4"
                            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <p className="text-sm font-semibold text-green-300">Repayment successful!</p>
                        </div>
                    )}

                    <button
                        onClick={() => repay(repayAmt)}
                        disabled={!repayAmt || repayN <= 0 || repayN > debtN || repayPending}
                        className="w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all"
                        style={(!repayAmt || repayN <= 0 || repayN > debtN || repayPending)
                            ? { background: 'rgba(239,68,68,0.3)', opacity: 0.5, cursor: 'not-allowed' }
                            : { background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}>
                        {repayPending ? '⏳ Repaying…' : '↙ Repay USDC'}
                    </button>
                </div>
            )}
        </div>
    );
}
