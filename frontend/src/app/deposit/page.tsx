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

import { Card, Button, Badge, MotionCard } from '@/components/ui';

export default function DepositPage() {
    const { isConnected } = useAccount();
    const [selected, setSelected] = useState(TOKENS[0]);
    const [amount, setAmount] = useState('');
    const { deposit, isPending, isSuccess, error, step } = useDepositCollateral();
    const { balance } = useTokenBalance(selected.address);
    const { value: colValue } = useCollateralValue();

    if (!isConnected) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8 text-center">
                <div className="w-24 h-24 border-2 rounded-3xl flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(var(--ink-rgb),0.2)]" style={{ borderColor: 'var(--border-strong)', background: 'var(--ink)' }}>
                    <ArrowDownToLine className="w-10 h-10" style={{ color: 'var(--surface)' }} />
                </div>
                <div>
                    <h1 className="text-4xl font-black mb-3 uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>Connect Wallet</h1>
                    <p className="max-w-md mx-auto font-medium text-neutral-500">
                        Connect to Moonbase Alpha (Polkadot testnet) to deposit collateral and start borrowing.
                    </p>
                </div>
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
        <div className="max-w-2xl mx-auto space-y-12">

            {/* Page header */}
            <div className="border-b-2 pb-8" style={{ borderColor: 'var(--border-strong)' }}>
                <h1 className="text-5xl font-extrabold uppercase tracking-tighter flex items-center gap-4 text-foreground">
                    <ArrowDownToLine className="w-10 h-10" /> Deposit
                </h1>
                <p className="font-normal mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Deposit tokens into the SmartVault to unlock borrowing power.
                </p>
            </div>

            {/* Current collateral */}
            <Card className="p-8 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-neutral-400">Current Collateral Value</p>
                    <p className="text-4xl font-black tracking-tighter">${parseFloat(colValue).toFixed(4)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Max borrow</p>
                    <p className="text-xl font-black tracking-tight">${(parseFloat(colValue) * 0.75).toFixed(4)}</p>
                    <Badge variant="conf" className="mt-2 text-[10px] px-3 py-1 uppercase font-black">75% LTV</Badge>
                </div>
            </Card>

            {/* Token selector */}
            <Card className="p-8 space-y-8">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4 text-center">Select Token Asset</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TOKENS.map((t) => (
                            <button key={t.address}
                                onClick={() => { setSelected(t); setAmount(''); }}
                                className="p-6 rounded-2xl text-center transition-all border-2 group shadow-[4px_4px_0px_0px_rgba(35,30,25,1)] hover:-translate-y-1"
                                style={{
                                    background: selected.address === t.address ? 'color-mix(in srgb, var(--bg-warm-footer) 60%, hsl(var(--card)))' : 'hsl(var(--card))',
                                    borderColor: selected.address === t.address ? 'var(--border-strong)' : 'hsl(var(--border) / 0.3)',
                                    color: 'hsl(var(--foreground))',
                                }}>
                                <p className="font-extrabold text-lg tracking-tighter uppercase mb-1">{t.symbol}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Weight: {t.weight}%</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Amount */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>Amount to Deposit</label>
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                            Bal: <span className="font-black" style={{ color: 'hsl(var(--foreground))' }}>{balN.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selected.symbol}</span>
                        </span>
                    </div>
                    <div className="relative">
                        <input
                            type="number" min="0"
                            className="w-full p-6 border-2 rounded-2xl font-black text-2xl tracking-tighter outline-none transition-shadow pr-24"
                            style={{
                                borderColor: 'var(--border-strong)',
                                background: 'hsl(var(--input))',
                                color: 'hsl(var(--foreground))',
                                boxShadow: amount ? '4px 4px 0px 0px rgba(var(--ink-rgb),1)' : 'none',
                            }}
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAmount(balN.toString())}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 font-black">
                            MAX
                        </Button>
                    </div>
                    {amtN > balN && balN > 0 && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Amount exceeds wallet balance.
                        </p>
                    )}
                </div>

                {/* Preview */}
                {amtN > 0 && (
                    <div className="rounded-2xl p-6 space-y-3 border-2 border-dashed" style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border) / 0.3)' }}>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span style={{ color: 'var(--text-secondary)' }}>Depositing</span>
                            <span style={{ color: 'hsl(var(--foreground))' }}>{amtN.toFixed(4)} {selected.symbol}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span style={{ color: 'var(--text-secondary)' }}>Risk weight</span>
                            <span style={{ color: 'hsl(var(--foreground))' }}>{selected.weight}%</span>
                        </div>
                        <div className="flex justify-between text-xs font-black uppercase tracking-tighter border-t pt-3" style={{ borderColor: 'hsl(var(--border) / 0.15)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Collateral value added</span>
                            <span className="text-lg" style={{ color: 'hsl(var(--foreground))' }}>+${colAdded.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span style={{ color: 'var(--text-secondary)' }}>Additional borrow capacity</span>
                            <span style={{ color: 'hsl(var(--foreground))' }}>+${(colAdded * 0.75).toFixed(4)}</span>
                        </div>
                    </div>
                )}

                {/* 2-step info */}
                {amtN > 0 && !isPending && !isSuccess && (
                    <div className="flex items-start gap-4 text-[10px] font-black uppercase tracking-widest rounded-2xl p-6 bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <div>
                            REQUIRES 2 TRANSACTIONS:
                            <p className="mt-1 text-neutral-400">(1) APPROVE SPENDING → (2) DEPOSIT TO VAULT</p>
                        </div>
                    </div>
                )}

                {/* Status messages using Badges/Alerts styling */}
                {(isPending || error || isSuccess) && (
                    <div className="space-y-4">
                        {isPending && (
                            <div className="flex items-center gap-4 rounded-2xl p-6 border-2 shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),1)]" style={{ background: 'hsl(var(--card))', borderColor: 'var(--border-strong)' }}>
                                <div className="spinner" style={{ borderColor: 'var(--ink)', borderTopColor: 'transparent' }} />
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest">
                                        {step === 'approving' ? 'Step 1/2 — Approving…'
                                            : step === 'depositing' ? 'Step 2/2 — Depositing…'
                                                : 'Processing…'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-start gap-4 rounded-2xl p-6 bg-red-50 border-2 border-red-500 text-red-500 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.2)]">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest">Transaction Failed</p>
                                    <p className="text-[10px] font-bold mt-1 opacity-80">{formatErr((error as any).message ?? '')}</p>
                                </div>
                            </div>
                        )}

                        {isSuccess && (
                            <div className="flex items-center gap-4 rounded-2xl p-6 bg-green-50 border-2 border-green-500 text-green-500 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.2)]">
                                <Check className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-black uppercase tracking-widest">Deposit successful!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Button */}
                <Button
                    onClick={handleDeposit}
                    disabled={!amount || amtN <= 0 || amtN > balN || isPending}
                    variant="default"
                    size="lg"
                    className="w-full h-16 text-lg font-extrabold uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(35,30,25,1)]">
                    {step === 'approving' ? '⏳ APPROVING…'
                        : step === 'depositing' ? '⏳ DEPOSITING…'
                            : '↓ DEPOSIT ASSETS'}
                </Button>
            </Card>
        </div>
    );
}
