'use client';

import { useState } from 'react';
import { useDepositCollateral } from '@/hooks/useProtocolActions';
import { useTokenBalance, useCollateralValue } from '@/hooks/useProtocolData';
import { CONTRACTS } from '@/config/contracts';
import { Check, AlertCircle, Info, ArrowDownToLine } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const TOKENS = [
    { name: 'Mock USDC', address: CONTRACTS.mockUSDC as `0x${string}`, symbol: 'mUSDC', weight: 90, color: '#22c55e', desc: 'Stablecoin — 90% risk weight' },
    { name: 'Yield Token', address: CONTRACTS.mockYield as `0x${string}`, symbol: 'mYLD', weight: 80, color: '#f59e0b', desc: 'Yield-bearing — 80% risk weight' },
    { name: 'RWA Token', address: CONTRACTS.mockRWA as `0x${string}`, symbol: 'mRWA', weight: 100, color: '#6366f1', desc: 'Real-World Asset — 100% risk weight' },
];

function formatErr(msg: string): string {
    if (!msg) return '';
    if (msg.includes('User rejected') || msg.includes('User denied')) return 'Transaction cancelled.';
    if (msg.includes('base fee') || msg.includes('underpriced')) return 'Gas estimate off — please try again.';
    if (msg.includes('allowance') || msg.includes('ERC20')) return 'Token approval failed — please try again.';
    if (msg.length > 140) return msg.slice(0, 140) + '…';
    return msg;
}

export default function DepositPage() {
    const { isConnected } = useAccount();
    const [selected, setSelected] = useState(TOKENS[0]);
    const [amount, setAmount] = useState('');
    const { deposit, isPending, isSuccess, error, step } = useDepositCollateral();
    const { balance } = useTokenBalance(selected.address);
    const { value: colValue } = useCollateralValue();

    if (!isConnected) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 text-center">
                <ArrowDownToLine className="w-12 h-12 text-indigo-400" />
                <h1 className="text-2xl font-bold text-white">Connect Wallet to Deposit</h1>
                <ConnectButton />
            </div>
        );
    }

    const balN = parseFloat(balance);
    const amtN = parseFloat(amount || '0');
    const colAdded = amtN * (selected.weight / 100);

    const handleDeposit = async () => {
        if (!amount || amtN <= 0) return;
        try { await deposit(selected.address, amount); setAmount(''); }
        catch { /* error in hook state */ }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">

            {/* Page header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <ArrowDownToLine className="w-7 h-7 text-indigo-400" /> Deposit Collateral
                </h1>
                <p className="text-[#a1a1c4] mt-1">
                    Deposit tokens into the SmartVault to unlock borrowing power.
                </p>
            </div>

            {/* Current collateral */}
            <div className="glass-card p-5 flex items-center justify-between">
                <div>
                    <p className="text-xs text-[#6b6b8a] uppercase tracking-wider mb-1">Your Current Collateral Value</p>
                    <p className="text-2xl font-bold text-white">${parseFloat(colValue).toFixed(4)}</p>
                </div>
                <div className="text-xs text-[#6b6b8a] text-right">
                    <p>Max borrow: <span className="text-white font-semibold">${(parseFloat(colValue) * 0.75).toFixed(4)}</span></p>
                    <p>at 75% LTV</p>
                </div>
            </div>

            {/* Token selector */}
            <div className="glass-card p-6 space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-[#a1a1c4] mb-3">Select Token</label>
                    <div className="grid grid-cols-3 gap-3">
                        {TOKENS.map((t) => (
                            <button key={t.address}
                                onClick={() => { setSelected(t); setAmount(''); }}
                                className="p-4 rounded-xl text-left transition-all"
                                style={{
                                    background: selected.address === t.address ? `${t.color}15` : 'rgba(255,255,255,0.03)',
                                    border: `2px solid ${selected.address === t.address ? t.color : 'rgba(255,255,255,0.08)'}`,
                                }}>
                                <p className="font-bold text-sm text-white mb-0.5" style={{ color: t.color }}>{t.symbol}</p>
                                <p className="text-xs text-[#6b6b8a]">Weight: {t.weight}%</p>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-[#6b6b8a] mt-2">{selected.desc}</p>
                </div>

                {/* Amount */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-semibold text-[#a1a1c4]">Amount</label>
                        <span className="text-xs text-[#6b6b8a]">
                            Balance: <span className="text-white font-medium">{balN.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selected.symbol}</span>
                        </span>
                    </div>
                    <div className="relative">
                        <input
                            type="number" min="0"
                            className="proto-input pr-20"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <button
                            onClick={() => setAmount(balN.toString())}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-1 rounded-md transition-colors"
                            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                            MAX
                        </button>
                    </div>
                    {amtN > balN && balN > 0 && (
                        <p className="text-xs text-red-400 mt-1.5">Amount exceeds wallet balance.</p>
                    )}
                </div>

                {/* Preview */}
                {amtN > 0 && (
                    <div className="rounded-xl p-4 space-y-2"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex justify-between text-sm">
                            <span className="text-[#a1a1c4]">Depositing</span>
                            <span className="text-white font-semibold">{amtN.toFixed(4)} {selected.symbol}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[#a1a1c4]">Risk weight</span>
                            <span className="text-white font-semibold">{selected.weight}%</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <span className="text-[#a1a1c4] font-medium">Collateral value added</span>
                            <span className="font-bold" style={{ color: selected.color }}>+${colAdded.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[#a1a1c4]">Additional borrow capacity</span>
                            <span className="text-white font-semibold">+${(colAdded * 0.75).toFixed(4)}</span>
                        </div>
                    </div>
                )}

                {/* 2-step info */}
                {amtN > 0 && !isPending && !isSuccess && (
                    <div className="flex items-start gap-2.5 text-xs rounded-lg p-3"
                        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        This requires <strong className="mx-1">2 MetaMask confirmations</strong>:
                        (1) Approve token spending → (2) Deposit into vault.
                    </div>
                )}

                {/* Step indicator */}
                {isPending && (
                    <div className="flex items-center gap-3 rounded-xl p-4"
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
                        <div className="spinner flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-indigo-300">
                                {step === 'approving' ? 'Step 1/2 — Approving…'
                                    : step === 'depositing' ? 'Step 2/2 — Depositing…'
                                        : 'Processing…'}
                            </p>
                            <p className="text-xs text-indigo-400/70 mt-0.5">Check MetaMask for a pending confirmation</p>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 rounded-xl p-4"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-300">Transaction Failed</p>
                            <p className="text-xs text-red-400/80 mt-0.5">{formatErr((error as any).message ?? '')}</p>
                        </div>
                    </div>
                )}

                {/* Success */}
                {isSuccess && (
                    <div className="flex items-center gap-3 rounded-xl p-4"
                        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <p className="text-sm font-semibold text-green-300">Deposit successful! Collateral added to vault.</p>
                    </div>
                )}

                {/* Button */}
                <button
                    onClick={handleDeposit}
                    disabled={!amount || amtN <= 0 || amtN > balN || isPending}
                    className="btn-glow w-full py-3.5 rounded-xl font-semibold text-white text-sm"
                    style={(!amount || amtN <= 0 || amtN > balN || isPending) ? { opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none', transform: 'none' } : {}}>
                    {step === 'approving' ? '⏳ Step 1/2: Approving…'
                        : step === 'depositing' ? '⏳ Step 2/2: Depositing…'
                            : '↓ Deposit Collateral'}
                </button>
            </div>
        </div>
    );
}
