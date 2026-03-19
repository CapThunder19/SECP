import { motion } from 'framer-motion';
import { ArrowRight, DollarSign, Shield, Zap, TrendingDown, Lock, Droplets, ArrowDownRight } from 'lucide-react';

interface ProtocolFlowProps {
    step: number; // Current active step (0-5)
    isActive: boolean; // Whether animation is active
}

export function ProtocolFlow({ step, isActive }: ProtocolFlowProps) {
    // Animation states for different steps
    const showMarketCrash = step >= 0;
    const showCollateralLoss = step >= 1;
    const showHealthDrop = step >= 2;
    const showVaultSwitch = step >= 3;
    const showProtection = step >= 4;

    return (
        <div className="relative w-full h-[600px] overflow-visible">
            {/* Background grid */}
            <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: 'linear-gradient(var(--border-strong) 1px, transparent 1px), linear-gradient(90deg, var(--border-strong) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }} />

            <svg viewBox="0 0 1200 600" className="w-full h-full">
                <defs>
                    {/* Arrow marker */}
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="var(--ink)" />
                    </marker>
                    
                    {/* Animated flow marker */}
                    <marker id="flowdot" markerWidth="8" markerHeight="8" refX="4" refY="4">
                        <circle cx="4" cy="4" r="3" fill="#6366f1">
                            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                    </marker>

                    {/* Gradient for loss */}
                    <linearGradient id="lossGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                </defs>

                {/* STEP 0: Market Crash - Top */}
                <motion.g
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: showMarketCrash ? 1 : 0, y: showMarketCrash ? 0 : -20 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Market crash box */}
                    <rect x="450" y="20" width="300" height="80" rx="20" 
                        fill="#ef4444" stroke="var(--border-strong)" strokeWidth="3" />
                    <text x="600" y="50" textAnchor="middle" fill="white" fontSize="16" fontWeight="900">
                        ⚡ MARKET CRASH
                    </text>
                    <text x="600" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" opacity="0.9">
                        Token Prices Drop
                    </text>
                    
                    {/* Downward arrows to collateral */}
                    {showCollateralLoss && (
                        <>
                            <motion.path
                                d="M 500 100 L 250 180"
                                stroke="#ef4444"
                                strokeWidth="4"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            />
                            <motion.path
                                d="M 600 100 L 600 180"
                                stroke="#ef4444"
                                strokeWidth="4"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            />
                            <motion.path
                                d="M 700 100 L 950 180"
                                stroke="#ef4444"
                                strokeWidth="4"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            />
                        </>
                    )}
                </motion.g>

                {/* STEP 1: Collateral Assets - Middle */}
                <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: showCollateralLoss ? 1 : 0, scale: showCollateralLoss ? 1 : 0.8 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    {/* Yield Strategy (left) */}
                    <g>
                        <rect x="100" y="200" width="200" height="100" rx="15" 
                            fill="#fbbf24" stroke="var(--border-strong)" strokeWidth="3" />
                        <text x="200" y="235" textAnchor="middle" fill="var(--ink)" fontSize="14" fontWeight="900">
                            💰 YIELD VAULT
                        </text>
                        <text x="200" y="260" textAnchor="middle" fill="var(--ink)" fontSize="12" fontWeight="600" opacity="0.7">
                            mYLD + mRWA
                        </text>
                        <motion.text x="200" y="285" textAnchor="middle" fill={showHealthDrop ? "#ef4444" : "#22c55e"} fontSize="18" fontWeight="900"
                            animate={{ opacity: showHealthDrop ? [1, 0.5, 1] : 1 }}
                            transition={{ duration: 1, repeat: showHealthDrop ? Infinity : 0 }}
                        >
                            {showHealthDrop ? "↓ VALUE DROP" : "$25.50"}
                        </motion.text>
                    </g>

                    {/* Main Collateral (center) */}
                    <g>
                        <rect x="450" y="200" width="200" height="100" rx="15" 
                            fill="#6366f1" stroke="var(--border-strong)" strokeWidth="3" />
                        <text x="550" y="235" textAnchor="middle" fill="white" fontSize="14" fontWeight="900">
                            🏦 COLLATERAL
                        </text>
                        <text x="550" y="260" textAnchor="middle" fill="white" fontSize="12" fontWeight="600" opacity="0.9">
                            All Tokens
                        </text>
                        <motion.text x="550" y="285" textAnchor="middle" fill={showHealthDrop ? "#fbbf24" : "white"} fontSize="18" fontWeight="900"
                            animate={{ opacity: showHealthDrop ? [1, 0.5, 1] : 1 }}
                            transition={{ duration: 1, repeat: showHealthDrop ? Infinity : 0 }}
                        >
                            {showHealthDrop ? "↓ $38.00" : "$51.00"}
                        </motion.text>
                    </g>

                    {/* Hedge Positions (right) */}
                    <g>
                        <rect x="800" y="200" width="200" height="100" rx="15" 
                            fill="#22c55e" stroke="var(--border-strong)" strokeWidth="3" />
                        <text x="900" y="235" textAnchor="middle" fill="var(--ink)" fontSize="14" fontWeight="900">
                            🛡️ HEDGE
                        </text>
                        <text x="900" y="260" textAnchor="middle" fill="var(--ink)" fontSize="12" fontWeight="600" opacity="0.7">
                            mDOT + mWBTC
                        </text>
                        <motion.text x="900" y="285" textAnchor="middle" fill={showHealthDrop ? "#ef4444" : "#22c55e"} fontSize="18" fontWeight="900"
                            animate={{ opacity: showHealthDrop ? [1, 0.5, 1] : 1 }}
                            transition={{ duration: 1, repeat: showHealthDrop ? Infinity : 0 }}
                        >
                            {showHealthDrop ? "↓ VALUE DROP" : "$25.50"}
                        </motion.text>
                    </g>
                </motion.g>

                {/* STEP 2: Health Factor Warning */}
                <motion.g
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: showHealthDrop ? 1 : 0, scale: showHealthDrop ? 1 : 0.5 }}
                    transition={{ duration: 0.5, delay: 1.0 }}
                >
                    <rect x="400" y="330" width="400" height="70" rx="15" 
                        fill="#f59e0b" stroke="var(--border-strong)" strokeWidth="3">
                        <animate attributeName="fill" values="#f59e0b;#ef4444;#f59e0b" dur="2s" repeatCount="indefinite" />
                    </rect>
                    <text x="600" y="360" textAnchor="middle" fill="white" fontSize="16" fontWeight="900">
                        ⚠️ HEALTH FACTOR: 114 → 68
                    </text>
                    <text x="600" y="385" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" opacity="0.9">
                        Below 100 = Liquidation Risk!
                    </text>
                </motion.g>

                {/* STEP 3: Vault Mode Switch - Arrows from health to anti-liquidation */}
                {showVaultSwitch && (
                    <>
                        <motion.path
                            d="M 600 400 L 600 450"
                            stroke="#6366f1"
                            strokeWidth="5"
                            fill="none"
                            markerEnd="url(#flowdot)"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.6, delay: 1.5 }}
                            strokeDasharray="10,5"
                        >
                            <animate attributeName="stroke-dashoffset" from="0" to="-15" dur="1s" repeatCount="indefinite" />
                        </motion.path>
                    </>
                )}

                {/* STEP 4: Anti-Liquidation System Activation */}
                <motion.g
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: showProtection ? 1 : 0, y: showProtection ? 0 : 20 }}
                    transition={{ duration: 0.6, delay: 2.0 }}
                >
                    {/* Anti-liquidation box */}
                    <rect x="350" y="470" width="500" height="100" rx="20" 
                        fill="#6366f1" stroke="var(--border-strong)" strokeWidth="4">
                        <animate attributeName="stroke" values="var(--border-strong);#22c55e;var(--border-strong)" dur="2s" repeatCount="indefinite" />
                    </rect>
                    <text x="600" y="505" textAnchor="middle" fill="white" fontSize="18" fontWeight="900">
                        🛡️ ANTI-LIQUIDATION ACTIVE
                    </text>
                    <text x="600" y="530" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" opacity="0.9">
                        Protocol Protection Engaged
                    </text>
                    
                    {/* Sub-actions */}
                    <g opacity="0.95">
                        <text x="380" y="555" fill="white" fontSize="11" fontWeight="600">
                            ✓ Vault Frozen
                        </text>
                        <text x="550" y="555" fill="white" fontSize="11" fontWeight="600">
                            ✓ Yield → Repayment
                        </text>
                        <text x="720" y="555" fill="white" fontSize="11" fontWeight="600">
                            ✓ No Penalty
                        </text>
                    </g>
                </motion.g>

                {/* STEP 5: Flow indicators - Yield redirected to debt repayment */}
                {showProtection && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 2.5 }}
                    >
                        {/* Arrow from yield vault to anti-liquidation */}
                        <motion.path
                            d="M 200 300 Q 200 400 350 520"
                            stroke="#22c55e"
                            strokeWidth="6"
                            fill="none"
                            markerEnd="url(#arrowhead)"
                            strokeDasharray="10,5"
                        >
                            <animate attributeName="stroke-dashoffset" from="0" to="-15" dur="1s" repeatCount="indefinite" />
                            <animate attributeName="stroke" values="#22c55e;#fbbf24;#22c55e" dur="2s" repeatCount="indefinite" />
                        </motion.path>
                        
                        {/* Label for flow */}
                        <motion.text x="220" y="380" fill="#22c55e" fontSize="12" fontWeight="900"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            💸 Yield Redirected
                        </motion.text>

                        {/* Arrow from hedge to anti-liquidation */}
                        <motion.path
                            d="M 900 300 Q 900 400 850 520"
                            stroke="#fbbf24"
                            strokeWidth="6"
                            fill="none"
                            markerEnd="url(#arrowhead)"
                            strokeDasharray="10,5"
                        >
                            <animate attributeName="stroke-dashoffset" from="0" to="-15" dur="1.3s" repeatCount="indefinite" />
                        </motion.path>
                        
                        {/* Label for rebalance */}
                        <motion.text x="750" y="380" fill="#fbbf24" fontSize="12" fontWeight="900"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        >
                            🔄 Rebalancing
                        </motion.text>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
