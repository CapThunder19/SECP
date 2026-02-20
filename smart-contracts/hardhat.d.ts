// Type extensions for Hardhat with Viem
import type { HardhatViemHelpers } from "@nomicfoundation/hardhat-viem";

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    viem: HardhatViemHelpers;
  }
}

export {};
