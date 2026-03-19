'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield, LayoutDashboard, ArrowDownToLine, Landmark, Droplets, Menu, X, TrendingDown, Sun, Moon, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
    { href: '/borrow', label: 'Borrow', icon: Landmark },
    { href: '/faucet', label: 'Faucet', icon: Droplets },
    { href: '/market', label: 'Market', icon: TrendingDown },
    { href: '/docs', label: 'Docs', icon: BookOpen },
];

function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <div className="w-9 h-9" />;

    const isDark = resolvedTheme === 'dark';

    return (
        <motion.button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors border-2"
            style={{
                background: 'hsl(var(--card))',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-secondary)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={isDark ? 'moon' : 'sun'}
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                >
                    {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
}

export function Navbar() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <motion.header
            className="sticky top-0 z-50 backdrop-blur-xl border-b-2"
            style={{
                background: 'color-mix(in srgb, var(--bg-warm) 85%, transparent)',
                borderColor: 'var(--border-strong)',
            }}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center justify-between h-20 gap-6">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(var(--ink-rgb),0.3)] border"
                            style={{
                                background: 'var(--ink)',
                                borderColor: 'var(--border-strong)',
                            }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Shield className="w-5 h-5" style={{ color: 'var(--surface)' }} />
                        </motion.div>
                        <span className="font-black text-xl tracking-tighter uppercase" style={{ color: 'hsl(var(--foreground))' }}>
                            SECP <span className="text-neutral-400">PROTOCOL</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link key={href} href={href}>
                                    <motion.div
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors relative uppercase tracking-widest"
                                        style={{
                                            color: active ? 'var(--surface)' : 'var(--text-secondary)',
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {label}
                                        {active && (
                                            <motion.div
                                                layoutId="nav-indicator"
                                                className="absolute inset-0 rounded-xl -z-10 border"
                                                style={{
                                                    background: 'var(--ink)',
                                                    borderColor: 'var(--border-strong)',
                                                    boxShadow: '2px 2px 0px 0px rgba(var(--ink-rgb),0.2)',
                                                }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right: theme + wallet + hamburger */}
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <div className="hidden md:block">
                            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
                        </div>
                        <motion.button
                            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-[2px_2px_0px_0px_rgba(var(--ink-rgb),1)]"
                            style={{
                                borderColor: 'var(--border-strong)',
                                background: 'hsl(var(--card))',
                                color: 'hsl(var(--foreground))',
                            }}
                            onClick={() => setMenuOpen(!menuOpen)}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Toggle menu"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div key={menuOpen ? 'x' : 'menu'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </motion.div>
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="md:hidden overflow-hidden"
                            style={{ borderTop: '1px solid var(--border-strong)' }}
                        >
                            <div className="py-3 pb-4 space-y-1">
                                {NAV_LINKS.map(({ href, label, icon: Icon }, i) => {
                                    const active = pathname === href;
                                    return (
                                        <motion.div
                                            key={href}
                                            initial={{ opacity: 0, x: -16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Link
                                                href={href}
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest border-2"
                                                style={{
                                                    color: active ? 'var(--surface)' : 'var(--text-secondary)',
                                                    background: active ? 'var(--ink)' : 'transparent',
                                                    borderColor: active ? 'var(--border-strong)' : 'transparent',
                                                }}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {label}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                                <div className="px-3 pt-4 border-t mt-2" style={{ borderColor: 'var(--border-strong)', opacity: 0.1 }}>
                                    <ConnectButton showBalance={false} chainStatus="none" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
}
