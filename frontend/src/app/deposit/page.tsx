'use client';

import { useState } from 'react';
import { useDepositCollateral } from '@/hooks/useProtocolActions';
import { useCrossChainDepositCollateral } from '@/hooks/useXCMProtocol';
import { useTokenBalance, useCollateralValue } from '@/hooks/useProtocolData';
import { getContractsForChain, XCMChain, XCM_CHAIN_NAMES } from '@/config/contracts';
import { Check, AlertCircle, Info, ArrowDownToLine, Globe } from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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
    const chainId = useChainId();
    const contracts = getContractsForChain(chainId);
    
    // Collateral tokens - USDC is ONLY for borrowing, NOT collateral
    const TOKENS = [
        { name: 'Mock DOT', address: contracts.mockDOT as `0x${string}`, symbol: 'mDOT', weight: 85, color: '#e91e8c', desc: 'Polkadot native — 85% risk weight' },
        { name: 'Mock WBTC', address: contracts.mockWBTC as `0x${string}`, symbol: 'mWBTC', weight: 90, color: '#f7931a', desc: 'Wrapped Bitcoin — 90% risk weight' },
        { name: 'RWA Token', address: contracts.mockRWA as `0x${string}`, symbol: 'mRWA', weight: 80, color: '#6366f1', desc: 'Real-World Asset — 80% risk weight' },
        { name: 'Yield Token', address: contracts.mockYield as `0x${string}`, symbol: 'mYLD', weight: 75, color: '#f59e0b', desc: 'Yield-bearing — 75% risk weight' },
    ];
    
    // XCM Chain options for cross-chain deposits
    const XCM_CHAINS = [
        { chain: XCMChain.PolkadotHub, name: XCM_CHAIN_NAMES[XCMChain.PolkadotHub] },
        { chain: XCMChain.Moonbeam, name: XCM_CHAIN_NAMES[XCMChain.Moonbeam] },
        { chain: XCMChain.Acala, name: XCM_CHAIN_NAMES[XCMChain.Acala] },
        { chain: XCMChain.Astar, name: XCM_CHAIN_NAMES[XCMChain.Astar] },
        { chain: XCMChain.Arbitrum, name: XCM_CHAIN_NAMES[XCMChain.Arbitrum] },
        { chain: XCMChain.Sepolia, name: XCM_CHAIN_NAMES[XCMChain.Sepolia] },
    ];
    
    const [selected, setSelected] = useState(TOKENS[0]);
    const [selectedChain, setSelectedChain] = useState<XCMChain>(XCMChain.PolkadotHub);
    const [amount, setAmount] = useState('');
    
    // Regular deposit hook (for local Moonbase Alpha deposits)
    const { deposit, isPending: isPendingLocal, isSuccess: isSuccessLocal, error: errorLocal, step } = useDepositCollateral();
    
    // Cross-chain deposit hook (for XCM transfers)
    const { depositFromChain, isPending: isPendingXCM, isSuccess: isSuccessXCM, error: errorXCM, step: stepXCM } = useCrossChainDepositCollateral();
    
    const { balance } = useTokenBalance(selected.address);
    const { value: colValue } = useCollateralValue();
    
    // Determine if we're doing cross-chain or local deposit
    // Moonbase Alpha chainId is 1287, which maps to Moonbeam in XCM enum
    const isLocalDeposit = selectedChain === XCMChain.Moonbeam;
    const isPending = isLocalDeposit ? isPendingLocal : isPendingXCM;
    const isSuccess = isLocalDeposit ? isSuccessLocal : isSuccessXCM;
    const error = isLocalDeposit ? errorLocal : errorXCM;
    const currentStep = isLocalDeposit ? step : stepXCM;

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
        
        console.log('Deposit clicked:', { 
            token: selected.address, 
            amount, 
            sourceChain: XCM_CHAIN_NAMES[selectedChain],
            isLocal: isLocalDeposit 
        });
        
        try {
            if (isLocalDeposit) {
                // Local deposit on Moonbase Alpha - normal 2-step process
                console.log('Executing local deposit...');
                await deposit(selected.address, amount);
            } else {
                // Cross-chain deposit via XCM Bridge
                console.log('Executing cross-chain deposit via XCM...');
                await depositFromChain(selected.address, amount, selectedChain);
            }
            
            setAmount(''); 
            console.log('Deposit successful');
        }
        catch (err) { 
            console.error('Deposit error in handler:', err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-12">

            {/* Page header */}
            <div className="border-b-2 pb-8" style={{ borderColor: 'var(--border-strong)' }}>
                <h1 className="text-5xl font-extrabold uppercase tracking-tighter flex items-center gap-4 text-foreground">
                    <ArrowDownToLine className="w-10 h-10" /> Deposit
                </h1>
                <p className="font-normal mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Deposit tokens into the SmartVault to unlock borrowing power. <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold"><Globe className="w-4 h-4" />Cross-chain deposits via XCM</span>
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

            {/* Cross-Chain Selection */}
            <Card className={`p-8 border-2 transition-all ${
                isLocalDeposit 
                    ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700' 
                    : 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-400 dark:border-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
            }`}>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            isLocalDeposit ? 'bg-gray-400' : 'bg-blue-500 animate-pulse'
                        }`}>
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-lg uppercase tracking-tight">Cross-Chain Deposit</h3>
                                {!isLocalDeposit && (
                                    <Badge variant="conf" className="text-[8px] px-2 py-0.5 bg-blue-500 text-white">ACTIVE</Badge>
                                )}
                            </div>
                            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {isLocalDeposit 
                                    ? 'Local deposit from your current wallet' 
                                    : 'Deposit from any supported blockchain via XCM'
                                }
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 mb-3">Source Blockchain</label>
                        <select
                            value={selectedChain}
                            onChange={(e) => setSelectedChain(Number(e.target.value) as XCMChain)}
                            className="w-full p-4 rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-[4px_4px_0px_0px_rgba(59,130,246,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,0.3)]"
                        >
                            {XCM_CHAINS.map((chain) => (
                                <option key={chain.chain} value={chain.chain}>
                                    {chain.name} {chain.chain === XCMChain.Moonbeam && '(Current)'}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-medium flex items-start gap-1">
                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>
                                {isLocalDeposit 
                                    ? 'Depositing from your connected wallet on Moonbase Alpha (standard 2-step deposit)'
                                    : `Your tokens will be transferred from ${XCM_CHAIN_NAMES[selectedChain]} to the SECP Protocol vault using XCM (Cross-Consensus Messaging). Bridge time: ~2-5 minutes.`
                                }
                            </span>
                        </p>
                    </div>
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
                            <span style={{ color: 'var(--text-secondary)' }}>Source Chain</span>
                            <span className="flex items-center gap-1" style={{ color: 'hsl(var(--foreground))' }}>
                                <Globe className="w-3 h-3" />
                                {XCM_CHAIN_NAMES[selectedChain]}
                            </span>
                        </div>
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

                {/* Transaction info */}
                {amtN > 0 && !isPending && !isSuccess && (
                    <div className="flex items-start gap-4 text-[10px] font-black uppercase tracking-widest rounded-2xl p-6 bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <div>
                            {isLocalDeposit ? (
                                <>
                                    REQUIRES 2 TRANSACTIONS:
                                    <p className="mt-1 text-neutral-400">(1) APPROVE SPENDING → (2) DEPOSIT TO VAULT</p>
                                </>
                            ) : (
                                <>
                                    CROSS-CHAIN DEPOSIT VIA XCM:
                                    <p className="mt-1 text-neutral-400">TOKENS WILL BE BRIDGED FROM {XCM_CHAIN_NAMES[selectedChain].toUpperCase()} TO MOONBASE ALPHA</p>
                                    <p className="mt-2 text-yellow-400">⚠️ Bridge time: ~2-5 minutes</p>
                                </>
                            )}
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
                                        {isLocalDeposit ? (
                                            currentStep === 'approving' ? 'Step 1/2 — Approving…'
                                                : currentStep === 'depositing' ? 'Step 2/2 — Depositing…'
                                                    : 'Processing…'
                                        ) : (
                                            currentStep === 'approve' ? 'Step 1/3 — Approving Bridge…'
                                                : currentStep === 'transfer' ? 'Step 2/3 — Transferring to Bridge…'
                                                    : currentStep === 'deposit' ? 'Step 3/3 — Initiating XCM Transfer…'
                                                        : 'Processing…'
                                        )}
                                    </p>
                                    {!isLocalDeposit && (
                                        <p className="text-[10px] text-neutral-500 mt-1">
                                            Bridging from {XCM_CHAIN_NAMES[selectedChain]} to Moonbase Alpha
                                        </p>
                                    )}
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
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest">Deposit successful!</p>
                                    {!isLocalDeposit && (
                                        <p className="text-[10px] font-bold mt-1 opacity-80">
                                            Cross-chain transfer initiated. Tokens will arrive in 2-5 minutes.
                                        </p>
                                    )}
                                </div>
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
                    {isPending ? (
                        isLocalDeposit ? (
                            currentStep === 'approving' ? '⏳ APPROVING…'
                                : currentStep === 'depositing' ? '⏳ DEPOSITING…'
                                    : '⏳ PROCESSING…'
                        ) : (
                            currentStep === 'approve' ? '⏳ APPROVING BRIDGE…'
                                : currentStep === 'transfer' ? '⏳ TRANSFERRING…'
                                    : currentStep === 'deposit' ? '⏳ BRIDGING VIA XCM…'
                                        : '⏳ PROCESSING…'
                        )
                    ) : (
                        isLocalDeposit 
                            ? `↓ DEPOSIT ${selected.symbol}`
                            : `🌍 BRIDGE FROM ${XCM_CHAIN_NAMES[selectedChain].toUpperCase()}`
                    )}
                </Button>
            </Card>
        </div>
    );
}
