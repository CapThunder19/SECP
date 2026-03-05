'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi';
import { getContractsForChain, XCMChain } from '@/config/contracts';
import { formatEther, parseEther } from 'viem';

// ─── XCM Bridge ABI ───
const XCM_BRIDGE_ABI = [
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'sourceChain', type: 'uint8' },
    ],
    name: 'initiateCrossChainDeposit',
    outputs: [{ name: 'depositId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'depositId', type: 'bytes32' }],
    name: 'completeCrossChainDeposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'destinationChain', type: 'uint8' },
    ],
    name: 'withdrawToCrossChain',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalTVL',
    outputs: [{ name: 'total', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'chain', type: 'uint8' },
    ],
    name: 'getPendingTransfers',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ─── AI Risk Predictor ABI ───
const AI_RISK_PREDICTOR_ABI = [
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'healthFactor', type: 'uint256' },
      { name: 'diversification', type: 'uint256' },
    ],
    name: 'predictUserRisk',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentMarketRisk',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserRiskProfile',
    outputs: [
      { name: 'riskScore', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' },
      { name: 'diversification', type: 'uint256' },
      { name: 'autoProtect', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'enabled', type: 'bool' }],
    name: 'setAutoProtection',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ─── Cross-Chain Rebalancer ABI ───
const CROSS_CHAIN_REBALANCER_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'rebalance',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'optimizePortfolioAcrossChains',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ─────────────────────────────────────────────────
// useXCMBridge — Cross-chain bridge operations
// ─────────────────────────────────────────────────

export function useXCMBridgeTVL() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data, isLoading, error } = useReadContract({
    address: contracts.xcmBridge as `0x${string}`,
    abi: XCM_BRIDGE_ABI,
    functionName: 'getTotalTVL',
    query: {
      refetchInterval: 15_000,
    },
  });

  return {
    tvl: data ? formatEther(data) : '0',
    isLoading,
    error,
  };
}

export function usePendingTransfers(chain: XCMChain) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data, isLoading } = useReadContract({
    address: contracts.xcmBridge as `0x${string}`,
    abi: XCM_BRIDGE_ABI,
    functionName: 'getPendingTransfers',
    args: address ? [address, chain] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });

  return {
    pending: data ? formatEther(data) : '0',
    isLoading,
  };
}

export function useInitiateCrossChainDeposit() {
  const { writeContract, isPending, isSuccess, error } = useWriteContract();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const initiate = async (
    token: `0x${string}`,
    amount: string,
    sourceChain: XCMChain
  ) => {
    return writeContract({
      address: contracts.xcmBridge as `0x${string}`,
      abi: XCM_BRIDGE_ABI,
      functionName: 'initiateCrossChainDeposit',
      args: [contracts.smartVault as `0x${string}`, token, parseEther(amount), sourceChain],
    });
  };

  return {
    initiate,
    isPending,
    isSuccess,
    error,
  };
}

export function useWithdrawToCrossChain() {
  const { writeContract, isPending, isSuccess, error } = useWriteContract();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const withdraw = async (
    token: `0x${string}`,
    amount: string,
    destinationChain: XCMChain
  ) => {
    return writeContract({
      address: contracts.xcmBridge as `0x${string}`,
      abi: XCM_BRIDGE_ABI,
      functionName: 'withdrawToCrossChain',
      args: [token, parseEther(amount), destinationChain],
    });
  };

  return {
    withdraw,
    isPending,
    isSuccess,
    error,
  };
}

// ─────────────────────────────────────────────────
// useCrossChainDepositCollateral — Deposit collateral from any chain
// ─────────────────────────────────────────────────

export function useCrossChainDepositCollateral() {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, error, data: hash } = useWriteContract();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const [step, setStep] = useState<'approve' | 'transfer' | 'deposit' | 'done'>('approve');

  const depositFromChain = async (
    token: `0x${string}`,
    amount: string,
    sourceChain: XCMChain
  ) => {
    if (!address) return;
    
    try {
      const amountWei = parseEther(amount);
      const bridgeAddress = contracts.xcmBridge as `0x${string}`;
      
      // Step 1: Approve bridge to spend tokens
      setStep('approve');
      await writeContract({
        address: token,
        abi: [
          {
            type: 'function',
            name: 'approve',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable'
          }
        ],
        functionName: 'approve',
        args: [bridgeAddress, amountWei],
      });
      
      // Wait for approval confirmation (you might want to use waitForTransactionReceipt here)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Transfer tokens to bridge
      setStep('transfer');
      await writeContract({
        address: token,
        abi: [
          {
            type: 'function',
            name: 'transfer',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable'
          }
        ],
        functionName: 'transfer',
        args: [bridgeAddress, amountWei],
      });
      
      // Wait for transfer confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Initiate cross-chain deposit
      setStep('deposit');
      await writeContract({
        address: bridgeAddress,
        abi: XCM_BRIDGE_ABI,
        functionName: 'initiateCrossChainDeposit',
        args: [address, token, amountWei, sourceChain],
      });
      
      setStep('done');
    } catch (err) {
      console.error('Cross-chain deposit error:', err);
      throw err;
    }
  };

  return {
    depositFromChain,
    isPending,
    isSuccess,
    error,
    step,
  };
}

// ─────────────────────────────────────────────────
// useAIRiskPredictor — AI-based risk assessment
// ─────────────────────────────────────────────────

export function useCurrentMarketRisk() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data, isLoading } = useReadContract({
    address: contracts.aiRiskPredictor as `0x${string}`,
    abi: AI_RISK_PREDICTOR_ABI,
    functionName: 'getCurrentMarketRisk',
    query: {
      refetchInterval: 10_000,
    },
  });

  // Convert enum to string
  const riskLevels = ['Low', 'Medium', 'High', 'Critical'];
  return {
    riskLevel: data !== undefined ? riskLevels[Number(data)] : 'Low',
    riskValue: data !== undefined ? Number(data) : 0,
    isLoading,
  };
}

export function useUserRiskProfile() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data, isLoading } = useReadContract({
    address: contracts.aiRiskPredictor as `0x${string}`,
    abi: AI_RISK_PREDICTOR_ABI,
    functionName: 'getUserRiskProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  });

  return {
    riskScore: data?.[0] ? Number(data[0]) : 0,
    healthFactor: data?.[1] ? Number(data[1]) : 0,
    diversification: data?.[2] ? Number(data[2]) : 0,
    autoProtect: data?.[3] ?? false,
    isLoading,
  };
}

export function useSetAutoProtection() {
  const { writeContract, isPending, isSuccess } = useWriteContract();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const setAutoProtection = async (enabled: boolean) => {
    return writeContract({
      address: contracts.aiRiskPredictor as `0x${string}`,
      abi: AI_RISK_PREDICTOR_ABI,
      functionName: 'setAutoProtection',
      args: [enabled],
    });
  };

  return {
    setAutoProtection,
    isPending,
    isSuccess,
  };
}

// ─────────────────────────────────────────────────
// useCrossChainRebalancer — Portfolio optimization
// ─────────────────────────────────────────────────

export function useTriggerRebalance() {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess } = useWriteContract();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const triggerRebalance = async () => {
    if (!address) return;
    return writeContract({
      address: contracts.crossChainRebalancer as `0x${string}`,
      abi: CROSS_CHAIN_REBALANCER_ABI,
      functionName: 'rebalance',
      args: [address],
    });
  };

  return {
    triggerRebalance,
    isPending,
    isSuccess,
  };
}

export function useOptimizePortfolio() {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess } = useWriteContract();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const optimizePortfolio = async () => {
    if (!address) return;
    return writeContract({
      address: contracts.crossChainRebalancer as `0x${string}`,
      abi: CROSS_CHAIN_REBALANCER_ABI,
      functionName: 'optimizePortfolioAcrossChains',
      args: [address],
    });
  };

  return {
    optimizePortfolio,
    isPending,
    isSuccess,
  };
}
