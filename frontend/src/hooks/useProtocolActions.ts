'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from 'wagmi';
import { getContractsForChain } from '@/config/contracts';
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
// Gas price helper — Moonbase Alpha EVM
//
// PROBLEM 1 (gas price): estimateFeesPerGas() can return inflated values.
//   We use getGasPrice() for accurate L2 pricing.
//
// PROBLEM 2 (gas limit): When a tx reverts during MetaMask's eth_estimateGas
//   call, MetaMask may fall back to very high gas limits. We set explicit
//   gas limits to prevent excessive estimates.
//
// MAX FEE per tx = gasLimit × gasPrice
//   e.g. 300,000 gas × 500,000,000 wei = 0.00015 DEV ≈ negligible
// ───────────────────────────────────────────────

// 0.5 gwei hard cap — Moonbase Alpha typical price is 0.01-0.1 gwei
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
  const chainId = useChainId();
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimFaucet = useCallback(async (token: `0x${string}`) => {
    reset();
    
    // Add extra error context for debugging
    try {
      writeContract({
        address: token,
        abi: FAUCET_ABI,
        functionName: 'faucet',
      });
    } catch (err: any) {
      console.error('Faucet transaction error:', err);
      throw err;
    }
  }, [writeContract, reset, chainId]);

  return { claimFaucet, hash, isPending: isPending || isConfirming, isSuccess, error };
}

// ───────────────────────────────────────────────
// Hook: Deposit Collateral (approve → confirm → deposit → confirm)
// ───────────────────────────────────────────────

export function useDepositCollateral() {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing'>('idle');

  const deposit = useCallback(async (tokenAddress: `0x${string}`, amount: string) => {
    if (!publicClient) {
      console.error('No public client available');
      throw new Error('No public client');
    }
    const contracts = getContractsForChain(chainId);
    console.log('Starting deposit:', { tokenAddress, amount, smartVault: contracts.smartVault });
    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    setStep('approving');

    try {
      const amountWei = parseEther(amount);
      console.log('Amount in wei:', amountWei);

      // Step 1: Approve - Let wallet estimate gas
      console.log('Submitting approval transaction...');
      const approveTx = await writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contracts.smartVault as `0x${string}`, amountWei],
      });
      console.log('Approval tx hash:', approveTx);
      await publicClient.waitForTransactionReceipt({ hash: approveTx, confirmations: 1 });
      console.log('Approval confirmed');

      setStep('depositing');

      // Step 2: Deposit - Let wallet estimate gas
      console.log('Submitting deposit transaction...');
      const depositTx = await writeContractAsync({
        address: contracts.smartVault as `0x${string}`,
        abi: SMART_VAULT_ABI,
        functionName: 'deposit',
        args: [tokenAddress, amountWei],
      });
      console.log('Deposit tx hash:', depositTx);
      await publicClient.waitForTransactionReceipt({ hash: depositTx, confirmations: 1 });
      console.log('Deposit confirmed');

      setHash(depositTx);
      setIsSuccess(true);
      setStep('idle');
    } catch (err: any) {
      console.error('Deposit failed:', err);
      setError(err);
      setStep('idle');
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [publicClient, writeContractAsync, chainId]);

  return { deposit, hash, isPending, isSuccess, error, step };
}

// ───────────────────────────────────────────────
// Hook: Borrow
// ───────────────────────────────────────────────

export function useBorrow() {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const borrow = useCallback(async (amount: string, durationDays: number) => {
    const contracts = getContractsForChain(chainId);
    reset();
    writeContract({
      address: contracts.loanManager as `0x${string}`,
      abi: LOAN_MANAGER_ABI,
      functionName: 'borrow',
      args: [parseEther(amount), BigInt(durationDays)],
    });
  }, [writeContract, reset, chainId]);

  return { borrow, hash, isPending: isPending || isConfirming, isSuccess, error };
}

// ───────────────────────────────────────────────
// Hook: Repay (approve USDC → confirm → repay → confirm)
// ───────────────────────────────────────────────

export function useRepay() {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const repay = useCallback(async (amount: string) => {
    if (!publicClient) throw new Error('No public client');
    const contracts = getContractsForChain(chainId);
    setIsPending(true);
    setIsSuccess(false);
    setError(null);

    try {
      const amountWei = parseEther(amount);

      // Step 1: Approve USDC spend - Let wallet estimate gas
      const approveTx = await writeContractAsync({
        address: contracts.mockUSDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contracts.loanManager as `0x${string}`, amountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx, confirmations: 1 });

      // Step 2: Repay - Let wallet estimate gas
      const repayTx = await writeContractAsync({
        address: contracts.loanManager as `0x${string}`,
        abi: LOAN_MANAGER_ABI,
        functionName: 'repay',
        args: [amountWei],
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
  }, [publicClient, writeContractAsync, chainId]);

  return { repay, hash, isPending, isSuccess, error };
}
