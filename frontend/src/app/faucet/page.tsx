'use client';

import { useFaucet } from '@/hooks/useProtocolActions';
import { useTokenBalance } from '@/hooks/useProtocolData';
import { getContractsForChain } from '@/config/contracts';
import { Check, AlertCircle, Droplets } from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, Button, Badge, MotionCard } from '@/components/ui';
import { GasBalanceChecker } from '@/components/faucet/GasBalanceChecker';

function FaucetCard({ token }: { token: { name: string; address: `0x${string}`; symbol: string; color: string; bg: string; border: string; desc: string; amount: string } }) {
    const { claimFaucet, isPending, isSuccess, error } = useFaucet();
    const { balance, isLoading: balL } = useTokenBalance(token.address);
    const { isConnected } = useAccount();

    const errMsg = (error as any)?.message;
    const displayErr = errMsg?.includes('User rejected') || errMsg?.includes('User denied')
        ? 'Cancelled.'
        : errMsg?.includes('insufficient funds') || errMsg?.includes('not enough funds')
            ? 'Not enough DEV for gas — get free tokens from faucet below ↓'
            : errMsg?.includes('base fee') || errMsg?.includes('underpriced')
                ? 'Gas issue — retry.'
                : errMsg?.slice(0, 80);

    return (
        <Card className="p-8 flex flex-col gap-6" style={{ borderColor: 'black' }}>
            {/* Token header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black border-2 shadow-[4px_4px_0px_0px_rgba(var(--ink-rgb),1)]"
                        style={{ color: token.color, borderColor: 'var(--border-strong)', background: 'hsl(var(--card))' }}>
                        {token.symbol.charAt(1)}
                    </div>
                    <div>
                        <p className="font-black text-xl uppercase tracking-tighter" style={{ color: 'hsl(var(--foreground))' }}>{token.symbol}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">FAUCET TOKEN</p>
                    </div>
                </div>

                <div className="border-t-2 border-dashed border-black/10 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Current Balance</p>
                    {balL ? (
                        <div className="h-4 w-16 rounded animate-pulse bg-neutral-100" />
                    ) : (
                        <p className="font-black text-2xl tracking-tighter" style={{ color: 'hsl(var(--foreground))' }}>
                            {parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    )}
                </div>
            </div>

            {/* Claim info */}
            <div className="rounded-2xl p-4 flex items-center justify-between border-2 shadow-inner" style={{ borderColor: 'var(--border-strong)', background: 'hsl(var(--muted))' }}>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Claim Amount</span>
                <span className="font-black" style={{ color: 'hsl(var(--foreground))' }}>{token.amount} {token.symbol}</span>
            </div>

            {/* Success / Error alerts using Badges style */}
            <div className="space-y-4">
                {isSuccess && (
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest rounded-2xl p-4 bg-green-50 border-2 border-green-500 text-green-600">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        +{token.amount} {token.symbol} minted!
                    </div>
                )}
                {error && (
                    <div className="flex items-start gap-3 text-[10px] font-black uppercase tracking-widest rounded-2xl p-4 bg-red-50 border-2 border-red-500 text-red-600">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {displayErr || 'FAUCET ERROR'}
                    </div>
                )}
            </div>

            {/* Claim button */}
            <Button
                onClick={() => claimFaucet(token.address)}
                disabled={!isConnected || isPending}
                className="w-full h-14 text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="spinner border-white border-t-transparent" />
                        MINTING…
                    </span>
                ) : (
                    `MINT ${token.symbol}`
                )}
            </Button>
        </Card>
    );
}

export default function FaucetPage() {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const contracts = getContractsForChain(chainId);

    // Define tokens - only 3 core tokens
    const TOKENS = [
        {
            name: 'Mock USDC',
            address: contracts.mockUSDC as `0x${string}`,
            symbol: 'mUSDC',
            color: '#22c55e',
            bg: 'rgba(34,197,94,0.08)',
            border: 'rgba(34,197,94,0.2)',
            desc: 'Stable collateral — 90% risk weight',
            amount: '1,000',
        },
        {
            name: 'Mock Yield Token',
            address: contracts.mockYield as `0x${string}`,
            symbol: 'mYLD',
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.08)',
            border: 'rgba(245,158,11,0.2)',
            desc: 'Yield-bearing collateral — 80% risk weight',
            amount: '1,000',
        },
        {
            name: 'Mock RWA Token',
            address: contracts.mockRWA as `0x${string}`,
            symbol: 'mRWA',
            color: '#6366f1',
            bg: 'rgba(99,102,241,0.08)',
            border: 'rgba(99,102,241,0.2)',
            desc: 'Real-World Asset collateral — 100% risk weight',
            amount: '1,000',
        },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-16">

            {/* Header */}
            <div className="border-b-2 pb-12" style={{ borderColor: 'var(--border-strong)' }}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8 shadow-[8px_8px_0px_0px_rgba(var(--ink-rgb),0.2)]" style={{ background: 'var(--ink)' }}>
                    <Droplets className="w-10 h-10" style={{ color: 'var(--surface)' }} />
                </div>
                <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Faucet</h1>
                <p className="text-neutral-400 font-medium max-w-2xl text-lg">
                    Mint free testnet tokens to experiment with the SECP Protocol.
                    Each token has a public <code className="font-black rounded-lg px-2 py-1" style={{ color: 'hsl(var(--foreground))', background: 'hsl(var(--muted))' }}>faucet()</code> function.
                </p>
            </div>

            {!isConnected ? (
                <div className="text-center py-24 border-2 border-dashed border-black/20 rounded-3xl">
                    <p className="text-neutral-400 font-black uppercase tracking-widest mb-8">Connect your wallet to claim tokens</p>
                    <ConnectButton />
                </div>
            ) : (
                <>
                    <GasBalanceChecker />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {TOKENS.map((t) => <FaucetCard key={t.address} token={t} />)}
                    </div>
                </>
            )}

            {/* Info boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-8 md:col-span-2">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                        <Droplets className="w-6 h-6" /> How to claim
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {[
                            'Buttons call faucet() on contract',
                            '1,000 tokens per transaction',
                            'No ownership or whitelist required',
                            'Claim as many times as you want',
                            'Tokens are non-transferable',
                            'Only for testnet experimentation'
                        ].map((item, i) => (
                            <li key={i} className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="p-8">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-6">Need Gas?</h3>
                    <p className="text-sm font-medium text-neutral-600 mb-4">
                        You need <strong>DEV tokens</strong> (native currency) to pay for transaction gas fees on Moonbase Alpha.
                    </p>
                    <div className="space-y-4">
                        {[
                            { name: 'Moonbase Faucet', url: 'https://faucet.moonbeam.network/' },
                        ].map(({ name, url }) => (
                            <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 border-2 border-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-0 hover:translate-x-[4px] hover:translate-y-[4px]">
                                {name} <Droplets className="w-3 h-3" />
                            </a>
                        ))}
                        <p className="text-[10px] font-medium text-neutral-500 pt-2">
                            Free DEV tokens from the Moonbase Alpha faucet — each drip covers thousands of transactions.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
