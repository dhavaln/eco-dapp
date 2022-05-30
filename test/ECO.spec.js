// This is an example test file. Hardhat will run every *.js file in `test/`,
// so feel free to add new ones.

// Hardhat tests are normally written with Mocha and Chai.

// We import Chai to use its asserting functions here.
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const delay = require('delay');

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.

function getTimeInEpoch(){
  return Math.round( Date.now() / 1000 );
}

describe("ECO Tests", function () {
  
    before("Deploy ECO master contract", async () => {
      const accounts = await ethers.getSigners();

      mainAcc = accounts[0];
      companyAAcc = accounts[1];      
      memberAAcc = accounts[2];
      companyBAcc = accounts[3];
      companyAERC = undefined;
      vestingWallet = undefined;

      const ECO = await ethers.getContractFactory("ECO");
      
      ecoMaster = await ECO.deploy();
      await ecoMaster.deployed();      
    });

    describe("Company tests", function () {
      it("create company A ERC", async function () {
        await expect(
          await ecoMaster.connect(companyAAcc).createCompanyERC("appgambit", "APPG", 999999)
        ).to.emit(ecoMaster, "CompanyERCTokenDeployed");

        companyAERC = await ecoMaster.connect(companyAAcc).getCompanyERC20Address("APPG");
      });

      it("signup company A", async function () {
        await expect(
          await ecoMaster.connect(companyAAcc).createCompany("appgambit", companyAERC)
        ).to.emit(ecoMaster, "VestingWalletAdded");

        await expect(
          await ecoMaster.connect(mainAcc).totalCompanies()
        ).to.equal(1);
      });

      it("validate company A vesting contract deployed", async function () {        
        vestingWallet = (await ecoMaster.connect(mainAcc).getAllCompanies())[0];
        expect(vestingWallet).to.be.not.null;                
      });

      it("trasfer tokens from ERC20 contract to Vesting Wallet", async function(){
        // from companyAERC address to vestingWallet address
        const CompanyERC = await ethers.getContractFactory("CompanyERC");
        const ercTokens = await CompanyERC.attach(companyAERC);
        
        await expect(
          await ercTokens.connect(companyAAcc).transfer(vestingWallet, 1000)
        ).to.emit(ercTokens, "Transfer");

        await expect(
          (await ercTokens.connect(vestingWallet).balanceOf(vestingWallet)).toString()
        ).to.equal("1000");
      });

      it("allocate company A vesting tokens to member", async function(){
        const waitTime = 5; // seconds 
        const tokensToTransfer = 1000;
        
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(vestingWallet);
        
        await vestingManager.connect(companyAAcc).allocateTokens(
          memberAAcc.address, 
          tokensToTransfer, 
          [tokensToTransfer/2, tokensToTransfer/2], 
          [getTimeInEpoch() + waitTime, getTimeInEpoch() + (waitTime * 2) ]
        );

        let allotment = await vestingManager.connect(memberAAcc).getAllotment();        
        expect(allotment.totalTokensAllotted).equal(tokensToTransfer);
        expect(allotment.isComplete).equal(false);
      });

      it('should wait for vesting time', async function(){
        // Increase the EVM time by given seconds
        await ethers.provider.send("evm_increaseTime", [6]);
      });

      it("release vesting tokens for member", async function() {
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(vestingWallet);
        
        await expect(vestingManager.connect(companyAAcc).releaseTokens(memberAAcc.address))
        .to.emit(vestingManager, "MemberTokensVested")
        .withArgs(memberAAcc.address, 500, false);
      });

      it("let member check the status of his allotment", async function(){        
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(vestingWallet);

        let allotment = await vestingManager.connect(memberAAcc).getAllotment();
        expect(allotment.totalTokensAllotted).equal(500);
        expect(allotment.totalTokensTransferred).equal(500);
        expect(allotment.isComplete).equal(false);
      });

      it('should wait for vesting time', async function(){        
        await ethers.provider.send("evm_increaseTime", [12]);
      });

      it("release remaining tokens for member", async function() {
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(vestingWallet);
        
        await expect(vestingManager.connect(companyAAcc).releaseTokens(memberAAcc.address))
        .to.emit(vestingManager, "MemberVestingComplete")
        .withArgs(memberAAcc.address, 1000);
      });

      it("let member check the final status of his allotment", async function(){        
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(vestingWallet);

        let allotment = await vestingManager.connect(memberAAcc).getAllotment();
        expect(allotment.totalTokensAllotted).equal(0);
        expect(allotment.totalTokensTransferred).equal(1000);
        expect(allotment.isComplete).equal(true);
      });

      it("validate total members allocated in company A", async function(){
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(vestingWallet);

        let allMembers = await vestingManager.connect(companyAAcc).getAllotedMembers();
        expect(allMembers.length).to.equal(1);
      });

      it("validate that only owner can run transactions on vesting wallet", async function() {
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(vestingWallet);
        
        await expect(
          vestingManager.connect(companyBAcc).releaseTokens(memberAAcc.address)
        ).to.be.reverted;
      });
    });
});
