'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import { fallback } from 'viem';

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5';

export const config = getDefaultConfig({
  appName: 'SECP Protocol',
  projectId,
  chains: [arbitrumSepolia],
  transports: {
    // Use multiple public RPC endpoints with automatic fallback
    [arbitrumSepolia.id]: fallback([
      http('https://sepolia-rollup.arbitrum.io/rpc'),
      http('https://arbitrum-sepolia.blockpi.network/v1/rpc/public'),
      http('https://public.stackup.sh/api/v1/node/arbitrum-sepolia'),
    ]),
  },
  ssr: true,
});
