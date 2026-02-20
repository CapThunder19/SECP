'use client';

import { useFaucet } from '@/hooks/useProtocolActions';
import { useTokenBalance } from '@/hooks/useProtocolData';
import { CONTRACTS } from '@/config/contracts';
import { Check, AlertCircle, Droplets } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const TOKENS = [
    {
        name: 'Mock USDC',
        address: CONTRACTS.mockUSDC as `0x${string}`,
        symbol: 'mUSDC',
        color: '#22c55e',
        bg: 'rgba(34,197,94,0.08)',
        border: 'rgba(34,197,94,0.2)',
        desc: 'Stable collateral — 90% risk weight',
        amount: '1,000',
    },
    {
        name: 'Mock Yield Token',
        address: CONTRACTS.mockYield as `0x${string}`,
        symbol: 'mYLD',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.2)',
        desc: 'Yield-bearing collateral — 80% risk weight',
        amount: '1,000',
    },
    {
        name: 'Mock RWA Token',
        address: CONTRACTS.mockRWA as `0x${string}`,
        symbol: 'mRWA',
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.08)',
        border: 'rgba(99,102,241,0.2)',
        desc: 'Real-World Asset collateral — 100% risk weight',
        amount: '1,000',
    },
];

function FaucetCard({ token }: { token: typeof TOKENS[0] }) {
    const { claimFaucet, isPending, isSuccess, error } = useFaucet();
    const { balance, isLoading: balL } = useTokenBalance(token.address);
    const { isConnected } = useAccount();

    const errMsg = (error as any)?.message;
    const displayErr = errMsg?.includes('User rejected') || errMsg?.includes('User denied')
        ? 'Cancelled.'
        : errMsg?.includes('base fee') || errMsg?.includes('underpriced')
            ? 'Gas issue — retry in a moment.'
            : errMsg?.slice(0, 100);

    return (
        <div className="glass-card p-6 flex flex-col gap-4" style={{ borderColor: token.border }}>
            {/* Token header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
                        style={{ background: token.bg, color: token.color, border: `1px solid ${token.border}` }}>
                        {token.symbol.charAt(1)}
                    </div>
                    <div>
                        <p className="font-bold text-white">{token.name}</p>
                        <p className="text-xs text-[#6b6b8a]">{token.desc}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-[#6b6b8a] mb-0.5">Your Balance</p>
                    {balL ? (
                        <div className="h-4 w-16 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    ) : (
                        <p className="font-bold text-white text-sm">
                            {parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    )}
                    <p className="text-xs" style={{ color: token.color }}>{token.symbol}</p>
                </div>
            </div>

            {/* Claim info */}
            <div className="rounded-xl p-3 flex items-center justify-between"
                style={{ background: token.bg, border: `1px solid ${token.border}` }}>
                <span className="text-sm text-[#a1a1c4]">You will receive</span>
                <span className="font-bold text-white">{token.amount} {token.symbol}</span>
            </div>

            {/* Success / Error */}
            {isSuccess && (
                <div className="flex items-center gap-2 text-xs rounded-lg p-3"
                    style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac' }}>
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    +{token.amount} {token.symbol} minted successfully!
                </div>
            )}
            {error && (
                <div className="flex items-start gap-2 text-xs rounded-lg p-3"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {displayErr || 'Failed — please try again.'}
                </div>
            )}

            {/* Claim button */}
            <button
                onClick={() => claimFaucet(token.address)}
                disabled={!isConnected || isPending}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={(!isConnected || isPending)
                    ? { background: 'rgba(255,255,255,0.04)', color: '#6b6b8a', cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.06)' }
                    : { background: token.bg, color: token.color, border: `1px solid ${token.border}`, cursor: 'pointer', boxShadow: `0 0 20px ${token.color}20` }}>
                {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="spinner" />
                        Minting…
                    </span>
                ) : (
                    `Claim ${token.amount} ${token.symbol}`
                )}
            </button>
        </div>
    );
}

export default function FaucetPage() {
    const { isConnected } = useAccount();

    return (
        <div className="max-w-3xl mx-auto space-y-8">

            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <Droplets className="w-7 h-7 text-indigo-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Token Faucet</h1>
                <p className="text-[#a1a1c4] max-w-lg mx-auto">
                    Claim free testnet tokens to experiment with the SECP Protocol.
                    Each token has a public <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">faucet()</code> — no ownership required.
                </p>
            </div>

            {!isConnected ? (
                <div className="text-center py-12 glass-card">
                    <p className="text-[#a1a1c4] mb-5">Connect your wallet to claim tokens</p>
                    <ConnectButton />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {TOKENS.map((t) => <FaucetCard key={t.address} token={t} />)}
                </div>
            )}

            {/* Info boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-5">
                    <h3 className="font-semibold text-white mb-2 text-sm">💡 How the Faucet Works</h3>
                    <ul className="text-xs text-[#a1a1c4] space-y-1.5 leading-relaxed">
                        <li>→ Each button calls <code className="text-indigo-400">faucet()</code> on the token contract</li>
                        <li>→ 1,000 tokens are minted directly to your wallet</li>
                        <li>→ No ownership required — fully public function</li>
                        <li>→ You can claim multiple times</li>
                    </ul>
                </div>
                <div className="glass-card p-5">
                    <h3 className="font-semibold text-white mb-2 text-sm">⛽ Need Gas (ETH)?</h3>
                    <p className="text-xs text-[#a1a1c4] mb-3">
                        You need Arbitrum Sepolia ETH to pay gas fees. Faucets below are free:
                    </p>
                    <div className="space-y-1.5">
                        {[
                            { name: 'Alchemy Faucet', url: 'https://www.alchemy.com/faucets/arbitrum-sepolia' },
                            { name: 'Triangle Faucet', url: 'https://faucet.triangleplatform.com/arbitrum/sepolia' },
                            { name: 'QuickNode Faucet', url: 'https://faucet.quicknode.com/arbitrum/sepolia' },
                        ].map(({ name, url }) => (
                            <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                                className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors hover:underline">
                                → {name}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
