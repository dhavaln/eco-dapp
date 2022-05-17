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
      companyAERC = accounts[2];      
      memberAAcc = accounts[3];      

      companyBAcc = accounts[4];
      memberBAcc = accounts[5];

      // console.log('main address', mainAcc.address);
      // console.log('company A wallet', companyAAcc.address);
      // console.log('company A ERC20', companyAERC.address);
      // console.log('member A wallet', memberAAcc.address);
      
      // console.log('company B wallet', companyBAcc.address);
      // console.log('member B wallet', memberBAcc.address);

      const ECO = await ethers.getContractFactory("ECO");
      
      ecoMaster = await ECO.deploy();
      await ecoMaster.deployed();      
    });

    describe("Company tests", function () {
      it("signup company A", async function () {
        await expect(
          await ecoMaster.connect(companyAAcc).createCompany("appgambit", companyAERC.address)
        ).to.emit(ecoMaster, "CompanyAdded");

        await expect(
          await ecoMaster.connect(mainAcc).totalCompanies()
        ).to.equal(1);
      });

      it("validate company A vesting contract deployed", async function () {
        address = await ecoMaster.connect(mainAcc).companies("appgambit")
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(address);
        
        await expect(
          await vestingManager.connect(companyAAcc).companyName()
        ).to.equal("appgambit");        
      });

      it("allocate company A vesting tokens to member", async function(){
        const waitTime = 2; // seconds 
        const tokensToTransfer = 1000;

        address = await ecoMaster.connect(mainAcc).companies("appgambit")
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(address);
        
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
        await delay(3 * 1000);
      });

      it("test vesting schedule", async function() {        

        address = await ecoMaster.connect(mainAcc).companies("appgambit")
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(address);
        
        await expect(vestingManager.connect(companyAAcc).releaseTokens(memberAAcc.address))
        .to.emit(vestingManager, "MemberTokensVested")
        .withArgs(memberAAcc.address, 500, false);

        let allotment = await vestingManager.connect(memberAAcc).getAllotment();
        console.log('member current release');
        console.log(allotment);
      });

      it("let member check the status of his allotment", async function(){
        address = await ecoMaster.connect(mainAcc).companies("appgambit")
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(address);

        let allotment = await vestingManager.connect(memberAAcc).getAllotment();
        console.log('member allotment status');
        console.log(allotment);
        expect(allotment.totalTokensAllotted).equal(500);
        expect(allotment.totalTokensTransferred).equal(500);
        expect(allotment.isComplete).equal(false);
      });

      it("validate total members allocated in company A", async function(){
        address = await ecoMaster.connect(mainAcc).companies("appgambit")
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(address);

        let allMembers = await vestingManager.connect(companyAAcc).getAllotedMembers();
        expect(allMembers.length).to.equal(1);
      });

      it("create ERC20 token for the company B", async function() {
      });

      it("signup company B with newly deployed ERC20 token", async function() {
      });

      it("add two member allocation in company B", async function() {

      });
    });
});
