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
describe("ECO Tests", function () {
  
    before("Deploy ECO master contract", async () => {
      const accounts = await ethers.getSigners();

      mainAcc = accounts[0];
      companyAAcc = accounts[1];
      companyAERC = accounts[2];      
      memberAAcc = accounts[5];      

      console.log('main address', mainAcc.address);
      console.log('company A wallet', companyAAcc.address);
      console.log('company A ERC20', companyAERC.address);
      console.log('member A wallet', memberAAcc.address);
      
      const ECO = await ethers.getContractFactory("ECO");
      

      ecoMaster = await ECO.deploy();
      await ecoMaster.deployed();      
    });

    describe("Company tests", function () {
      it("signup first company", async function () {
        await expect(
          await ecoMaster.connect(companyAAcc).createCompany("appgambit", companyAERC.address)
        ).to.emit(ecoMaster, "CompanyAdded");

        await expect(
          await ecoMaster.connect(mainAcc).totalCompanies()
        ).to.equal(1);
      });

      it("validate company vesting contract deployed", async function () {
        address = await ecoMaster.connect(mainAcc).companies("appgambit")
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(address);
        
        await expect(
          await vestingManager.connect(companyAAcc).companyName()
        ).to.equal("appgambit");        
      });

      it("allocate vesting tokens to member", async function(){
        const waitTime = 10; // seconds 
        const tokensToTransfer = 1000;

        address = await ecoMaster.connect(mainAcc).companies("appgambit")
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(address);

        await vestingManager.connect(companyAAcc).allocateTokens(memberAAcc.address, tokensToTransfer, waitTime);

        let allotment = await vestingManager.connect(companyAAcc).allotments(memberAAcc.address);
        expect(allotment.tokensAllotted).equal(tokensToTransfer);
        expect(allotment.isComplete).equal(false);
      });

      it('should wait for vesting time', async function(){
        await delay(12 * 1000);
      });

      it("test vesting schedule", async function() {
        const tokensToTransfer = 1000;

        address = await ecoMaster.connect(mainAcc).companies("appgambit")
        const VestingManager = await ethers.getContractFactory("VestingManager");
        const vestingManager = await VestingManager.attach(address);
        
        await vestingManager.connect(companyAAcc).releaseTokens(memberAAcc.address);

        allotment = await vestingManager.connect(companyAAcc).allotments(memberAAcc.address);
        expect(allotment.tokensAllotted).equal(0);
        expect(allotment.tokensTransferred).equal(tokensToTransfer);
        expect(allotment.isComplete).equal(true);
      });
    });
});
