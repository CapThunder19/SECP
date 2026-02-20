import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SECPProtocolModule = buildModule("SECPProtocol", (m) => {
  // 1. Deploy Mock Tokens
  const mockUSDC = m.contract("MockUSDC");
  const mockYield = m.contract("MockYield");
  const mockRWA = m.contract("MockRWA");

  // 2. Deploy Oracle
  const mockOracle = m.contract("MockOracle");

  // 3. Deploy SmartVault
  const smartVault = m.contract("SmartVault");

  // 4. Deploy LoanManager with mockUSDC as loan token
  const loanManager = m.contract("LoanManager", [mockUSDC]);

  // 5. Deploy CollateralManager with vault, oracle, and loanManager
  const collateralManager = m.contract("CollateralManager", [
    smartVault,
    mockOracle,
    loanManager,
  ]);

  // 6. Deploy AntiLiquidation with vault and loanManager
  const antiLiquidation = m.contract("AntiLiquidation", [
    smartVault,
    loanManager,
  ]);

  // 7. Deploy Rebalancer with vault, collateralManager, and antiLiquidation
  const rebalancer = m.contract("Rebalancer", [
    smartVault,
    collateralManager,
    antiLiquidation,
  ]);

  // 8. Deploy YieldManager with loanManager and collateralManager
  const yieldManager = m.contract("YieldManager", [
    loanManager,
    collateralManager,
  ]);

  return {
    mockUSDC,
    mockYield,
    mockRWA,
    mockOracle,
    smartVault,
    loanManager,
    collateralManager,
    antiLiquidation,
    rebalancer,
    yieldManager,
  };
});

export default SECPProtocolModule;
