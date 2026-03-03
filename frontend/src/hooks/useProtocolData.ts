'use client';

import { useAccount, useReadContract, useChainId } from 'wagmi';
import { getContractsForChain } from '@/config/contracts';
import { formatEther } from 'viem';

// ─── Collateral Manager ABI (only what we need) ───
const COLLATERAL_MANAGER_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getTotalCollateralValue',
    outputs: [{ name: 'totalValue', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getHealthFactor',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getMaxBorrowAmount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getMode',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ─── Loan Manager ABI ───
const LOAN_MANAGER_ABI = [
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'debt',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getBorrowerScore',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'isLoanExpired',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ─── ERC-20 ABI ───
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ─────────────────────────────────────────────────
// useCollateralValue — total risk-adjusted collateral
// ─────────────────────────────────────────────────
export function useCollateralValue() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data, isLoading, error } = useReadContract({
    address: contracts.collateralManager as `0x${string}`,
    abi: COLLATERAL_MANAGER_ABI,
    functionName: 'getTotalCollateralValue',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });

  return {
    value: data ? formatEther(data) : '0',
    isLoading,
    error,
  };
}

// ─────────────────────────────────────────────────
// useDebt — current USDC debt
// ─────────────────────────────────────────────────
export function useDebt() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data, isLoading, error } = useReadContract({
    address: contracts.loanManager as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: 'debt',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });

  return {
    debt: data ? formatEther(data) : '0',
    isLoading,
    error,
  };
}

// ─────────────────────────────────────────────────
// useHealthFactor
// ─────────────────────────────────────────────────
export function useHealthFactor() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data, isLoading, error } = useReadContract({
    address: contracts.collateralManager as `0x${string}`,
    abi: COLLATERAL_MANAGER_ABI,
    functionName: 'getHealthFactor',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });

  // Contract returns health factor scaled by 1 (integer, not 1e18)
  // e.g. 150 = 1.5x (150%), 85 = liquidation threshold, 100 = danger
  const rawHF = data ? Number(data) : 0;
  // If no debt, contract returns type(uint256).max — treat as safe
  const isMaxUint = data !== undefined && data === BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
  const healthFactor = isMaxUint ? Infinity : rawHF;
  const isSafe = isMaxUint || rawHF >= 150;
  const displayHF = isMaxUint ? '∞' : (rawHF / 100).toFixed(2);

  return {
    healthFactor: displayHF,
    rawHealthFactor: rawHF,
    isSafe,
    isLoading,
    error,
  };
}

// ─────────────────────────────────────────────────
// useMaxBorrow — max borrowable from contract
// ─────────────────────────────────────────────────
export function useMaxBorrow() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data, isLoading, error } = useReadContract({
    address: contracts.collateralManager as `0x${string}`,
    abi: COLLATERAL_MANAGER_ABI,
    functionName: 'getMaxBorrowAmount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });

  return {
    maxBorrow: data ? formatEther(data) : '0',
    isLoading,
    error,
  };
}

// ─────────────────────────────────────────────────
// useTokenBalance
// ─────────────────────────────────────────────────
export function useTokenBalance(tokenAddress: `0x${string}`) {
  const { address } = useAccount();

  const { data, isLoading, error } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });

  return {
    balance: data ? formatEther(data) : '0',
    isLoading,
    error,
  };
}

// ─────────────────────────────────────────────────
// useLoanMode — Flexible / Conservative / Freeze
// ─────────────────────────────────────────────────
export function useLoanMode() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data, isLoading, error } = useReadContract({
    address: contracts.collateralManager as `0x${string}`,
    abi: COLLATERAL_MANAGER_ABI,
    functionName: 'getMode',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  });

  const modeNames = ['Flexible', 'Conservative', 'Freeze'];
  const mode = data !== undefined ? (modeNames[Number(data)] ?? 'Unknown') : 'Flexible';

  return {
    mode,
    modeValue: data,
    isLoading,
    error,
  };
}

// ─────────────────────────────────────────────────
// useBorrowerScore — 0–100 reliability score
// ─────────────────────────────────────────────────
export function useBorrowerScore() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data, isLoading } = useReadContract({
    address: contracts.loanManager as `0x${string}`,
    abi: LOAN_MANAGER_ABI,
    functionName: 'getBorrowerScore',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    score: data !== undefined ? Number(data) : 100,
    isLoading,
  };
}
