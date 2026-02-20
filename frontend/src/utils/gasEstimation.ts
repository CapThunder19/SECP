import { PublicClient } from 'viem';

/**
 * Get gas parameters with a buffer to prevent "max fee per gas less than block base fee" errors
 * Arbitrum Sepolia's base fee changes rapidly, so we add a 20% buffer
 */
export async function getBufferedGasParams(publicClient: PublicClient) {
  try {
    // Get current base fee from latest block
    const block = await publicClient.getBlock({ blockTag: 'latest' });
    const baseFee = block.baseFeePerGas;

    if (!baseFee) {
      // Fallback if baseFee not available
      return undefined;
    }

    // Add 20% buffer to base fee
    const bufferedBaseFee = (baseFee * BigInt(120)) / BigInt(100);

    // Set max priority fee (tip for validators) - keep it minimal for Arbitrum
    const maxPriorityFeePerGas = BigInt(1000); // Very small tip

    // Max fee = buffered base fee + priority fee
    const maxFeePerGas = bufferedBaseFee + maxPriorityFeePerGas;

    console.log('Gas calculation:', {
      baseFee: baseFee.toString(),
      bufferedBaseFee: bufferedBaseFee.toString(),
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    });

    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gas: BigInt(150000), // Reasonable gas limit for most transactions
    };
  } catch (error) {
    console.error('Error getting buffered gas params:', error);
    return undefined;
  }
}

/**
 * Get a simple multiplier for gas estimates
 * Use this as a fallback when block data is unavailable
 */
export function getGasMultiplier() {
  return 1.2; // 20% buffer
}
