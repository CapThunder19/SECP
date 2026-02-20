import { expect } from "chai";
import { network } from "hardhat";
import { parseEther } from "viem";

describe("SECP Protocol Integration", function () {
  async function deploySECPFixture() {
    const { viem } = await network.connect();
    const [owner, user1, user2] = await viem.getWalletClients();

    // Deploy all contracts
    const mockUSDC = await viem.deployContract("MockUSDC");
    const mockYield = await viem.deployContract("MockYield");
    const mockRWA = await viem.deployContract("MockRWA");
    const mockOracle = await viem.deployContract("MockOracle");
    const smartVault = await viem.deployContract("SmartVault");
    const loanManager = await viem.deployContract("LoanManager", [
      mockUSDC.address,
    ]);
    const collateralManager = await viem.deployContract(
      "CollateralManager",
      [smartVault.address, mockOracle.address, loanManager.address]
    );
    const antiLiquidation = await viem.deployContract("AntiLiquidation", [
      smartVault.address,
      loanManager.address,
    ]);
    const rebalancer = await viem.deployContract("Rebalancer", [
      smartVault.address,
      collateralManager.address,
      antiLiquidation.address,
    ]);
    const yieldManager = await viem.deployContract("YieldManager", [
      loanManager.address,
      collateralManager.address,
    ]);

    // Setup
    await mockOracle.write.setPrice([mockUSDC.address, parseEther("1")]);
    await mockOracle.write.setPrice([mockYield.address, parseEther("1.05")]);
    await mockOracle.write.setPrice([mockRWA.address, parseEther("1.5")]);
    
    await collateralManager.write.setAssetWeight([mockUSDC.address, 90n]);
    await collateralManager.write.setAssetWeight([mockYield.address, 80n]);
    await collateralManager.write.setAssetWeight([mockRWA.address, 100n]);

    await smartVault.write.addSupportedToken([mockUSDC.address]);
    await smartVault.write.addSupportedToken([mockYield.address]);
    await smartVault.write.addSupportedToken([mockRWA.address]);

    await loanManager.write.setCollateralManager([collateralManager.address]);
    await loanManager.write.setAntiLiquidation([antiLiquidation.address]);

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
      owner,
      user1,
      user2,
    };
  }

  describe("Deployment", function () {
    it("Should deploy all contracts", async function () {
      const { smartVault, loanManager, collateralManager } =
        await deploySECPFixture();

      expect(smartVault.address).to.not.be.undefined;
      expect(loanManager.address).to.not.be.undefined;
      expect(collateralManager.address).to.not.be.undefined;
    });
  });

  describe("Basic Flow", function () {
    it("Should allow deposit, borrow, and health factor calculation", async function () {
      const {
        mockUSDC,
        smartVault,
        loanManager,
        collateralManager,
        user1,
      } = await deploySECPFixture();

      // Mint tokens to user1
      await mockUSDC.write.mint([
        user1.account.address,
        parseEther("1000"),
      ]);

      // User1 deposits collateral
      const { viem } = await network.connect();
      const publicClient = await viem.getPublicClient();
      await mockUSDC.write.approve(
        [smartVault.address, parseEther("1000")],
        { account: user1.account }
      );
      await smartVault.write.deposit(
        [mockUSDC.address, parseEther("1000")],
        { account: user1.account }
      );

      // Check collateral
      const collateral = await smartVault.read.getCollateral([
        user1.account.address,
        mockUSDC.address,
      ]);
      expect(collateral).to.equal(parseEther("1000"));

      // Transfer loan tokens to loan manager for borrowing
      await mockUSDC.write.mint([
        loanManager.address,
        parseEther("10000"),
      ]);

      // User1 borrows
      await mockUSDC.write.approve(
        [loanManager.address, parseEther("500")],
        { account: user1.account }
      );
      await loanManager.write.borrow([parseEther("500"), 30n], {
        account: user1.account,
      });

      // Check debt
      const debt = await loanManager.read.debt([user1.account.address]);
      expect(debt).to.equal(parseEther("500"));

      // Check health factor
      const healthFactor = await collateralManager.read.getHealthFactor([
        user1.account.address,
      ]);
      expect(Number(healthFactor)).to.be.greaterThan(0);
    });

    it("Should switch to Conservative mode on high volatility", async function () {
      const {
        mockUSDC,
        smartVault,
        loanManager,
        collateralManager,
        mockOracle,
        user1,
      } = await deploySECPFixture();

      // Setup: deposit and borrow
      await mockUSDC.write.mint([
        user1.account.address,
        parseEther("1000"),
      ]);
      await mockUSDC.write.approve(
        [smartVault.address, parseEther("1000")],
        { account: user1.account }
      );
      await smartVault.write.deposit(
        [mockUSDC.address, parseEther("1000")],
        { account: user1.account }
      );
      await mockUSDC.write.mint([
        loanManager.address,
        parseEther("10000"),
      ]);
      await mockUSDC.write.approve(
        [loanManager.address, parseEther("500")],
        { account: user1.account }
      );
      await loanManager.write.borrow([parseEther("500"), 30n], {
        account: user1.account,
      });

      // Increase volatility
      await mockOracle.write.setVolatility([60n]);

      // Update mode
      await collateralManager.write.autoUpdateMode([user1.account.address]);

      // Check mode changed to Conservative (1)
      const mode = await collateralManager.read.getMode([
        user1.account.address,
      ]);
      expect(mode).to.equal(1); // Conservative
    });
  });

  describe("Borrower Memory", function () {
    it("Should track borrower history", async function () {
      const { mockUSDC, loanManager, user1 } = await deploySECPFixture();

      // Setup tokens
      await mockUSDC.write.mint([
        loanManager.address,
        parseEther("10000"),
      ]);
      await mockUSDC.write.mint([
        user1.account.address,
        parseEther("1000"),
      ]);

      // Borrow
      await loanManager.write.borrow([parseEther("100"), 30n], {
        account: user1.account,
      });

      // Check history
      const history = await loanManager.read.borrowerHistory([
        user1.account.address,
      ]);
      expect(history[0]).to.equal(parseEther("100")); // totalBorrowed
      expect(Number(history[5])).to.be.greaterThan(0); // lastLoanTimestamp
    });
  });
});
