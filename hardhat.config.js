require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");

const { API_URL, PRIVATE_KEY, ETHERSCAN_KEY, COINMARKETCAP_KEY } = require('./secrets.json');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
    },
    rinkeby: {
      url: API_URL,
      accounts: [PRIVATE_KEY]
    }
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 21,
    showTimeSpent: true,
    url: 'http://localhost:8545',
    coinmarketcap: COINMARKETCAP_KEY
  },  
  etherscan: {
    apiKey: ETHERSCAN_KEY
  },
  solidity: "0.8.4",
};
