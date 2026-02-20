'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { parseEther } from 'viem';

// ───────────────────────────────────────────────
// ABIs
// ───────────────────────────────────────────────

const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const FAUCET_ABI = [
  {
    inputs: [],
    name: 'faucet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const SMART_VAULT_ABI = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const LOAN_MANAGER_ABI = [
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'durationDays', type: 'uint256' },
    ],
    name: 'borrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'repay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ───────────────────────────────────────────────
// Gas price helper — DUAL FIX for Arbitrum Sepolia
//
// PROBLEM 1 (gas price): estimateFeesPerGas() and block.baseFeePerGas both
//   include L1 calldata cost → produces values like 1-2 ETH/gas. Fixed by
//   using eth_gasPrice (getGasPrice) which returns L2-only price.
//
// PROBLEM 2 (gas limit): When a tx reverts during MetaMask's eth_estimateGas
//   call, MetaMask falls back to Arbitrum's enormous block gas limit (can be
//   billions of gas units). We MUST set explicit gas limits so MetaMask never
//   uses that fallback.
//
// MAX FEE per tx = gasLimit × gasPrice
//   e.g. 300,000 gas × 500,000,000 wei = 0.00015 ETH ≈ $0.30
// ───────────────────────────────────────────────

// 0.5 gwei hard cap — Arbitrum Sepolia real price is 0.01-0.1 gwei
const MAX_GAS_PRICE = BigInt(500_000_000);

// Explicit gas limits per operation (prevents MetaMask fallback to block gas limit)
const GAS_LIMITS = {
  approve: BigInt(80_000),   // ERC20 approve
  faucet: BigInt(80_000),   // token faucet()
  deposit: BigInt(200_000),  // SmartVault.deposit
  borrow: BigInt(300_000),  // LoanManager.borrow
  repay: BigInt(200_000),  // LoanManager.repay
} as const;

async function getSafeGasPrice(publicClient: ReturnType<typeof usePublicClient>): Promise<bigint> {
  if (!publicClient) return MAX_GAS_PRICE;
  try {
    const gp = await publicClient.getGasPrice();
    const buffered = gp * BigInt(130) / BigInt(100); // +30% buffer
    return buffered < MAX_GAS_PRICE ? buffered : MAX_GAS_PRICE;
  } catch {
    return BigInt(100_000_000); // 0.1 gwei fallback
  }
}

// ───────────────────────────────────────────────
// Hook: Faucet
// ───────────────────────────────────────────────

export function useFaucet() {
  const publicClient = usePublicClient();
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimFaucet = useCallback(async (tokenAddress: `0x${string}`) => {
    reset();
    const gasPrice = await getSafeGasPrice(publicClient);
    writeContract({
      address: tokenAddress,
      abi: FAUCET_ABI,
      functionName: 'faucet',
      gas: GAS_LIMITS.faucet,
      gasPrice,
    });
  }, [writeContract, reset, publicClient]);

  return { claimFaucet, hash, isPending: isPending || isConfirming, isSuccess, error };
}

// ───────────────────────────────────────────────
// Hook: Deposit Collateral (approve → confirm → deposit → confirm)
// ───────────────────────────────────────────────

export function useDepositCollateral() {
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing'>('idle');

  const deposit = useCallback(async (tokenAddress: `0x${string}`, amount: string) => {
    if (!publicClient) throw new Error('No public client');
    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    setStep('approving');

    try {
      const amountWei = parseEther(amount);
      const gasPrice = await getSafeGasPrice(publicClient);

      // Step 1: Approve
      const approveTx = await writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.smartVault, amountWei],
        gas: GAS_LIMITS.approve,
        gasPrice,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx, confirmations: 1 });

      setStep('depositing');
      const gasPrice2 = await getSafeGasPrice(publicClient);

      // Step 2: Deposit
      const depositTx = await writeContractAsync({
        address: CONTRACTS.smartVault,
        abi: SMART_VAULT_ABI,
        functionName: 'deposit',
        args: [tokenAddress, amountWei],
        gas: GAS_LIMITS.deposit,
        gasPrice: gasPrice2,
      });
      await publicClient.waitForTransactionReceipt({ hash: depositTx, confirmations: 1 });

      setHash(depositTx);
      setIsSuccess(true);
      setStep('idle');
    } catch (err: any) {
      setError(err);
      setStep('idle');
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [publicClient, writeContractAsync]);

  return { deposit, hash, isPending, isSuccess, error, step };
}

// ───────────────────────────────────────────────
// Hook: Borrow
// ───────────────────────────────────────────────

export function useBorrow() {
  const publicClient = usePublicClient();
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const borrow = useCallback(async (amount: string, durationDays: number) => {
    reset();
    const gasPrice = await getSafeGasPrice(publicClient);
    writeContract({
      address: CONTRACTS.loanManager,
      abi: LOAN_MANAGER_ABI,
      functionName: 'borrow',
      args: [parseEther(amount), BigInt(durationDays)],
      gas: GAS_LIMITS.borrow,
      gasPrice,
    });
  }, [writeContract, reset, publicClient]);

  return { borrow, hash, isPending: isPending || isConfirming, isSuccess, error };
}

// ───────────────────────────────────────────────
// Hook: Repay (approve USDC → confirm → repay → confirm)
// ───────────────────────────────────────────────

export function useRepay() {
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const repay = useCallback(async (amount: string) => {
    if (!publicClient) throw new Error('No public client');
    setIsPending(true);
    setIsSuccess(false);
    setError(null);

    try {
      const amountWei = parseEther(amount);
      const gasPrice = await getSafeGasPrice(publicClient);

      // Step 1: Approve USDC spend
      const approveTx = await writeContractAsync({
        address: CONTRACTS.mockUSDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.loanManager, amountWei],
        gas: GAS_LIMITS.approve,
        gasPrice,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx, confirmations: 1 });

      const gasPrice2 = await getSafeGasPrice(publicClient);

      // Step 2: Repay
      const repayTx = await writeContractAsync({
        address: CONTRACTS.loanManager,
        abi: LOAN_MANAGER_ABI,
        functionName: 'repay',
        args: [amountWei],
        gas: GAS_LIMITS.repay,
        gasPrice: gasPrice2,
      });
      await publicClient.waitForTransactionReceipt({ hash: repayTx, confirmations: 1 });

      setHash(repayTx);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [publicClient, writeContractAsync]);

  return { repay, hash, isPending, isSuccess, error };
}
