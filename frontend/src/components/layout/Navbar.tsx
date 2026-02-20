'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield, LayoutDashboard, ArrowDownToLine, Landmark, Droplets, Menu, X, TrendingDown, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
    { href: '/borrow', label: 'Borrow', icon: Landmark },
    { href: '/faucet', label: 'Faucet', icon: Droplets },
    { href: '/market', label: 'Market', icon: TrendingDown },
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
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
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
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    return (
        <motion.header
            className="sticky top-0 z-50 navbar"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.12)' : 'none' }}
        >
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5">
                        <motion.div
                            className="w-8 h-8 rounded-xl flex items-center justify-center btn-glow"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Shield className="w-4 h-4 text-white" />
                        </motion.div>
                        <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            SECP <span className="gradient-text">Protocol</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link key={href} href={href}>
                                    <motion.div
                                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors relative"
                                        style={{
                                            color: active ? 'white' : 'var(--text-secondary)',
                                            background: active ? 'var(--accent-hex)' : 'transparent',
                                        }}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {label}
                                        {active && (
                                            <motion.div
                                                layoutId="nav-indicator"
                                                className="absolute inset-0 rounded-xl -z-10"
                                                style={{ background: 'var(--accent-hex)' }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right: theme + wallet + hamburger */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <div className="hidden md:block">
                            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
                        </div>
                        <motion.button
                            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                            onClick={() => setMenuOpen(!menuOpen)}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Toggle menu"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div key={menuOpen ? 'x' : 'menu'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                    {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
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
                            style={{ borderTop: '1px solid var(--border-color)' }}
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
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                                                style={{
                                                    color: active ? 'white' : 'var(--text-secondary)',
                                                    background: active ? 'var(--accent-hex)' : 'transparent',
                                                }}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {label}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                                <div className="px-3 pt-2">
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
