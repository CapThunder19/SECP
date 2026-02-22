'use client';

import { ThemeProvider } from 'next-themes';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config as wagmiConfig } from '@/config/wagmi';
import { useTheme } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

function RainbowWithTheme({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useTheme();
    return (
        <RainbowKitProvider theme={resolvedTheme === 'light' ? lightTheme({
            accentColor: '#000000',
            accentColorForeground: 'white',
            borderRadius: 'large',
        }) : darkTheme({
            accentColor: '#000000',
            accentColorForeground: 'white',
            borderRadius: 'large',
            overlayBlur: 'small',
        })}>
            {children}
        </RainbowKitProvider>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange={false}
            storageKey="secp-theme"
        >
            <WagmiProvider config={wagmiConfig}>
                <QueryClientProvider client={queryClient}>
                    <RainbowWithTheme>
                        {children}
                    </RainbowWithTheme>
                </QueryClientProvider>
            </WagmiProvider>
        </ThemeProvider>
    );
}
