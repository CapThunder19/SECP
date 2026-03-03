import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PolkadotHubModule = buildModule("PolkadotHub", (m) => {
  // 1. Deploy Mock Tokens (including new Polkadot ecosystem tokens)
  const mockUSDC = m.contract("MockUSDC");
  const mockYield = m.contract("MockYield");
  const mockRWA = m.contract("MockRWA");
  const mockDOT = m.contract("MockDOT");
  const mockWBTC = m.contract("MockWBTC");

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

  // 7. Deploy XCM Bridge for cross-chain support
  const xcmBridge = m.contract("XCMBridge");

  // 8. Deploy AI Risk Predictor
  const aiRiskPredictor = m.contract("AIRiskPredictor");

  // 9. Deploy Cross-Chain Rebalancer with vault, collateralManager, and antiLiquidation
  const crossChainRebalancer = m.contract("CrossChainRebalancer", [
    smartVault,
    collateralManager,
    antiLiquidation,
  ]);

  // 10. Deploy YieldManager with loanManager and collateralManager
  const yieldManager = m.contract("YieldManager", [
    loanManager,
    collateralManager,
  ]);

  // Configuration calls after deployment
  // Note: These would be done in a separate setup script

  return {
    // Original tokens
    mockUSDC,
    mockYield,
    mockRWA,
    // New Polkadot tokens
    mockDOT,
    mockWBTC,
    // Core contracts
    mockOracle,
    smartVault,
    loanManager,
    collateralManager,
    antiLiquidation,
    yieldManager,
    // New cross-chain contracts
    xcmBridge,
    aiRiskPredictor,
    crossChainRebalancer,
  };
});

export default PolkadotHubModule;
