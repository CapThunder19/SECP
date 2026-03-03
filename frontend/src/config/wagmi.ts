'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import { fallback } from 'viem';
import { defineChain } from 'viem';

// Define Polkadot Asset Hub custom chain
export const polkadotHub = defineChain({
  id: 1000,
  name: 'Polkadot Asset Hub',
  nativeCurrency: {
    name: 'DOT',
    symbol: 'DOT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.polkadot.io'],
    },
    public: {
      http: ['https://rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Polkadot Explorer',
      url: 'https://polkadot.subscan.io',
    },
  },
  testnet: false,
});

// Moonbase Alpha (Moonbeam testnet - Polkadot parachain)
export const moonbaseAlpha = defineChain({
  id: 1287,
  name: 'Moonbase Alpha',
  nativeCurrency: {
    name: 'DEV',
    symbol: 'DEV',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.api.moonbase.moonbeam.network'],
    },
    public: {
      http: ['https://rpc.api.moonbase.moonbeam.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Moonscan',
      url: 'https://moonbase.moonscan.io',
    },
  },
  testnet: true,
});

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '0000000000000000000000000000000000000000';

export const config = getDefaultConfig({
  appName: 'SECP Protocol',
  projectId,
  chains: [moonbaseAlpha, polkadotHub, arbitrumSepolia],
  transports: {
    // Polkadot Asset Hub with fallback
    [polkadotHub.id]: fallback([
      http('https://rpc.polkadot.io'),
      http('https://polkadot-rpc.dwellir.com'),
    ]),
    // Moonbase Alpha (testnet)
    [moonbaseAlpha.id]: fallback([
      http('https://rpc.api.moonbase.moonbeam.network'),
    ]),
    // Arbitrum Sepolia (original chain)
    [arbitrumSepolia.id]: fallback([
      http('https://sepolia-rollup.arbitrum.io/rpc'),
      http('https://arbitrum-sepolia.blockpi.network/v1/rpc/public'),
      http('https://public.stackup.sh/api/v1/node/arbitrum-sepolia'),
    ]),
  },
  ssr: true,
});
