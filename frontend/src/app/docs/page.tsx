'use client';

import { Droplets, Shield, TrendingDown, Zap, BarChart, ArrowRight, BookOpen, AlertTriangle, Calculator, FileText, Globe, Terminal, Activity } from 'lucide-react';
import { Card, Badge, MotionCard } from '@/components/ui';

export default function DocsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-16">
            {/* Header */}
            <div className="border-b-2 pb-12" style={{ borderColor: 'var(--border-strong)' }}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8 shadow-[8px_8px_0px_0px_rgba(var(--ink-rgb),0.2)]" style={{ background: 'var(--ink)' }}>
                    <BookOpen className="w-10 h-10" style={{ color: 'var(--surface)' }} />
                </div>
                <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Documentation</h1>
                <p className="text-neutral-400 font-medium max-w-2xl text-lg relative z-0">
                    Learn about the <strong className="text-black dark:text-white">SECP Protocol</strong> mechanics, collateral pricing rules, and our unique Anti-Liquidation engine.
                </p>
            </div>

            {/* Protocol Overview section */}
            <section className="space-y-6">
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-500" /> SECP Protocol Overview
                </h2>
                <Card className="p-8 leading-relaxed font-medium">
                    <p className="mb-4">
                        The SECP Protocol is a decentralized, risk-adjusted lending platform built on Moonbase Alpha (Polkadot), leveraging cross-chain capabilities via XCM. 
                    </p>
                    <p className="mb-4">
                        Unlike traditional DeFi protocols (Aave, Compound) that instantaneously auction off your assets at a discount when market prices dip, SECP introduces a resilient <strong>Anti-Liquidation Engine</strong>. We freeze vaults under extreme distress and use native asset yield to predictably pay down the debt without sacrificing user principals.
                    </p>
                </Card>
            </section>            {/* User Journey & Protocol Lifecycle */}
            <section className="space-y-6">
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Activity className="w-8 h-8 text-indigo-500" /> Protocol Lifecycle
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Step 1 */}
                    <Card className="p-8 border-t-4" style={{ borderTopColor: '#3b82f6' }}>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 font-black text-sm">1</span>
                            <h3 className="text-xl font-black uppercase tracking-widest text-blue-500">Deposit & Lend</h3>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-neutral-500">
                            Users start by locking supported collateral assets (like mDOT, mWBTC, or mRWA) into their personal isolated SECP <strong>Smart Vault</strong>. By keeping their principal actively locked, the underlying collateral can be put to work automatically generating base protocol yields behind the scenes (staking, RWA treasuries, etc).
                        </p>
                    </Card>

                    {/* Step 2 */}
                    <Card className="p-8 border-t-4" style={{ borderTopColor: '#10b981' }}>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 font-black text-sm">2</span>
                            <h3 className="text-xl font-black uppercase tracking-widest text-green-500">Borrowing USDC</h3>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-neutral-500">
                            Once collateral is securely vaulted, users can borrow up to an actively weighted 75% LTV in USDC directly from the SECP <strong>LoanManager</strong>. As long as the health factor is stable (green), the borrower acts as normal, deploying the USDC liquidity outwards.
                        </p>
                    </Card>

                    {/* Step 3 */}
                    <Card className="p-8 md:col-span-2 border-t-4" style={{ borderTopColor: '#ef4444' }}>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 font-black text-sm">3</span>
                            <h3 className="text-xl font-black uppercase tracking-widest text-red-500">Market Crash & Yield Shifting</h3>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-neutral-500 mb-4">
                            When global markets plummet, oracle prices drop, plunging the Smart Vaults into <strong>Freeze Mode</strong>. Traditional platforms instantly liquidate users into the ground by selling off their DOT or WBTC at discount auctions.
                        </p>
                        <div className="p-6 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-red-200 dark:border-red-900/50">
                            <h4 className="font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <ArrowRight className="w-5 h-5 text-red-500" /> The Anti-Liquidation Shift
                            </h4>
                            <p className="text-[13px] font-bold leading-relaxed text-neutral-500">
                                Instead of destroying the principal collateral, SECP activates the <strong>YieldManager</strong>. All ongoing native staking rewards, yield distributions, or RWA rebases that the underlying collateral is organically earning are strictly diverted. This intercepted yield is forcibly funneled backwards to gently "pay down" the user&apos;s active debt over time, stabilizing the Health Factor without evaporating the user&apos;s base position. The user loses their daily earnings entirely until the debt is back to safe levels!
                            </p>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Core Formulae section */}
            <section className="space-y-6">
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Calculator className="w-8 h-8 text-pink-500" /> Core Formulae
                </h2>
                
                <div className="grid grid-cols-1 gap-6">
                    {/* Formula 1 */}
                    <Card className="p-8 border-l-4" style={{ borderLeftColor: '#e91e8c' }}>
                        <h3 className="text-xl font-black uppercase tracking-widest mb-4 text-pink-500">1. Total Risk-Adjusted Collateral</h3>
                        <p className="text-sm font-medium mb-4 text-neutral-500">
                            Each token type is given a unique <strong>Risk Weight</strong>. A risk weight represents the percentage of the asset's dollar value that can be counted toward borrowing.
                        </p>
                        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl mb-4 font-mono text-sm border-2 border-black/10 dark:border-white/10">
                            Value = Σ (TokenAmount × OraclePrice × (TokenRiskWeight / 100))
                        </div>
                        <ul className="text-xs uppercase tracking-widest font-black grid grid-cols-2 gap-4 mt-6">
                            <li className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                                <span>mUSDC</span> <span className="text-green-500">95%</span>
                            </li>
                            <li className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                                <span>mWBTC</span> <span className="text-yellow-500">90%</span>
                            </li>
                            <li className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                                <span>mDOT</span> <span className="text-pink-500">85%</span>
                            </li>
                            <li className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                                <span>mRWA</span> <span className="text-indigo-500">80%</span>
                            </li>
                            <li className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                                <span>mYIELD</span> <span className="text-orange-500">75%</span>
                            </li>
                        </ul>
                    </Card>

                    {/* Formula 2 */}
                    <Card className="p-8 border-l-4" style={{ borderLeftColor: '#22c55e' }}>
                        <h3 className="text-xl font-black uppercase tracking-widest mb-4 text-green-500">2. Health Factor (HF)</h3>
                        <p className="text-sm font-medium mb-4 text-neutral-500">
                            The Health Factor dictates the safety of your loan. A larger HF means your borrowed position is solidly overcollateralized.
                        </p>
                        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl mb-4 font-mono text-sm border-2 border-black/10 dark:border-white/10">
                            Health Factor = (Total Risk-Adjusted Collateral × 85) / Active Debt
                        </div>
                        <div className="flex flex-col gap-2 mt-4 text-[10px] uppercase font-black tracking-widest text-neutral-500">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> HF &gt; 150 : Safe (Flexible Mode)</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500" /> 100 &lt; HF ≤ 150 : Warning (Conservative Mode)</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> HF ≤ 100 : Critical (Freeze Mode)</div>
                        </div>
                    </Card>

                    {/* Formula 3 */}
                    <Card className="p-8 border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
                        <h3 className="text-xl font-black uppercase tracking-widest mb-4 text-yellow-500">3. Maximum Borrowing</h3>
                        <p className="text-sm font-medium mb-4 text-neutral-500">
                            The absolute ceiling up to which a user can borrow. SECP utilizes an aggressive 75% globally unified LTV target based on the risk-adjusted value.
                        </p>
                        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl mb-4 font-mono text-sm border-2 border-black/10 dark:border-white/10">
                            Max Borrow = Total Risk-Adjusted Collateral × 0.75
                        </div>
                        <p className="text-xs uppercase tracking-widest font-black text-neutral-500">
                            Borrow Utilization = (Active Debt / Max Borrow) × 100
                        </p>
                    </Card>
                </div>
            </section>

            {/* Anti Liquidation Engine */}
            <section className="space-y-6">
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Zap className="w-8 h-8 text-yellow-400" /> Smart Vault Modes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MotionCard className="p-6 transition-all border-t-8" style={{ borderTopColor: '#22c55e' }}>
                        <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 border border-green-500 flex-shrink-0">
                            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">Flexible Mode</h3>
                        <p className="text-sm font-medium text-neutral-500">
                            Standard mode when HF &gt; 150 and Oracle Volatility is low. Users enjoy full withdrawal, deposit, and borrowing rights.
                        </p>
                    </MotionCard>
                    <MotionCard className="p-6 transition-all border-t-8" style={{ borderTopColor: '#f59e0b' }}>
                        <div className="w-12 h-12 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4 border border-yellow-500 flex-shrink-0">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">Conservative Mode</h3>
                        <p className="text-sm font-medium text-neutral-500">
                            Activated when 100 &lt; HF ≤ 150. Borrowing abilities might be severely limited or rate-bounded to prevent slipping into critical zones.
                        </p>
                    </MotionCard>
                    <MotionCard className="p-6 transition-all border-t-8" style={{ borderTopColor: '#ef4444' }}>
                        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 border border-red-500 flex-shrink-0">
                            <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">Freeze Mode</h3>
                        <p className="text-sm font-medium text-neutral-500">
                            Activated rigidly when HF ≤ 100 OR Oracle Volatility exceeds 80! Withdrawals are halted. Native Yield intercepts to slowly trim debt avoiding immediate liquidations.
                        </p>
                    </MotionCard>
                </div>
            </section>

            {/* Smart Contract Interaction */}
            <section className="space-y-6 pb-12">
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                    <FileText className="w-8 h-8 text-neutral-500" /> Contract Interactions
                </h2>
                <Card className="p-8">
                    <ul className="space-y-6 text-sm font-medium leading-relaxed">
                        <li className="border-b-2 border-dashed border-black/10 dark:border-white/10 pb-6">
                            <strong className="text-black dark:text-white uppercase tracking-widest block mb-2 text-md">MockOracle</strong>
                            Provides on-chain mock pricing natively and emits global <code>marketVolatility</code> indices which are polled by protocol logic continually.
                        </li>
                        <li className="border-b-2 border-dashed border-black/10 dark:border-white/10 pb-6">
                            <strong className="text-black dark:text-white uppercase tracking-widest block mb-2 text-md">LoanManager &amp; CollateralManager</strong>
                            Work hand-in-hand to approve loan issuances, maintaining ledger ledgers, asserting protocol invariant checks, and recalculating health vectors in virtually constant time O(1).
                        </li>
                        <li>
                            <strong className="text-black dark:text-white uppercase tracking-widest block mb-2 text-md">YieldManager</strong>
                            Harnesses native token yields and securely interfaces with Vaults to funnel active yield earnings backwards into isolated un-frozen repayment avenues inside the Loan Manager.
                        </li>
                    </ul>
                </Card>
            </section>

            {/* XCM Explanations */}
            <section className="space-y-6 pb-12">
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Globe className="w-8 h-8 text-blue-400" /> Cross-Chain XCM Architecture
                </h2>
                <Card className="p-8 leading-relaxed font-medium">
                    <p className="mb-4">
                        SECP operates with a global liquidity perspective by heavily integrating Polkadot&apos;s <strong>Cross-Consensus Messaging (XCM)</strong> format. XCM empowers smart contracts on our native deploying parachain (e.g., Moonbase Alpha) to natively communicate intent, transfer assets, and assess collateral originating from entirely separate Layer-1 chains inside the Polkadot Ecosystem.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-6 rounded-2xl">
                            <h4 className="font-black uppercase tracking-widest text-blue-500 mb-2">Remote Collateral</h4>
                            <p className="text-sm text-neutral-500 font-medium">
                                Deposit native tokens (like DOT) straight from Polkadot Asset Hub into your SECP parity Vault on Moonbeam via XCM asset teleportation, utilizing unified execution environments.
                            </p>
                        </div>
                        <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-6 rounded-2xl">
                            <h4 className="font-black uppercase tracking-widest text-indigo-500 mb-2">XCM Rebalancing</h4>
                            <p className="text-sm text-neutral-500 font-medium">
                                The protocol can rebalance cross-chain liquidity passively by dispatching XCM <code>Transact</code> instructions outward holding surplus stablecoins securely against extreme volatility on isolated side-chains.
                            </p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* How to Run the Protocol */}
            <section className="space-y-6 pb-24">
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Terminal className="w-8 h-8 text-green-500" /> How to Run This Protocol
                </h2>
                <Card className="p-8">
                    <p className="text-sm font-medium mb-8 text-neutral-500">
                        Running SECP Protocol locally or configuring it for Testnet requires setting up BOTH the Smart Contracts and the Next.js Frontend.
                    </p>
                    
                    <div className="space-y-8">
                        {/* Step 1 */}
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black font-black text-sm">1</span>
                                <h3 className="text-xl font-black uppercase tracking-widest">Deploy Smart Contracts</h3>
                            </div>
                            <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-xl font-mono text-sm border-2 border-black/10 dark:border-white/10 space-y-2">
                                <p className="text-neutral-500"># Navigate to the smart contracts directory</p>
                                <p>cd smart-contracts</p>
                                <p className="text-neutral-500 mt-4"># Install dependencies</p>
                                <p>npm install</p>
                                <p className="text-neutral-500 mt-4"># Setup your keys (add your private key to .env)</p>
                                <p>cp .env.example .env</p>
                                <p className="text-neutral-500 mt-4"># Compile and deploy to Polkadot testnet (Moonbase Alpha)</p>
                                <p>npx hardhat run scripts/deploy.ts --network moonbaseAlpha</p>
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-rose-500 mt-4">
                                * Keep track of the contract addresses printed in the terminal!
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black font-black text-sm">2</span>
                                <h3 className="text-xl font-black uppercase tracking-widest">Configure & Run Frontend</h3>
                            </div>
                            <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-xl font-mono text-sm border-2 border-black/10 dark:border-white/10 space-y-2">
                                <p className="text-neutral-500"># Navigate to frontend &amp; install dependencies</p>
                                <p>cd ../frontend</p>
                                <p>npm install</p>
                                <p className="text-neutral-500 mt-4"># Update configuration</p>
                                <p>Open <code>src/config/contracts.ts</code> and replace the mock addresses with your newly deployed contract addresses.</p>
                                <p className="text-neutral-500 mt-4"># Start the development server</p>
                                <p>npm run dev</p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black font-black text-sm">3</span>
                                <h3 className="text-xl font-black uppercase tracking-widest">Initial Setup (Testnet)</h3>
                            </div>
                            <p className="text-sm font-medium text-neutral-500 pl-12">
                                With the DApp running at <code>http://localhost:3000</code>, head to the <strong className="text-black dark:text-white uppercase tracking-widest">Faucet</strong> tab to mint your testing ERC-20 tokens. Ensure your wallet is connected to the Moonbase Alpha remote RPC.
                            </p>
                        </div>
                    </div>
                </Card>
            </section>
        </div>
    );
}
