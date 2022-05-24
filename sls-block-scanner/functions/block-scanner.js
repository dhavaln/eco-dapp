const ethers = require('ethers');
const ECO = require('../contracts/ECOContract.json');
const { CONTRACT_ADDRESS, DEPLOYER_KEY, NETWORK_URL } = process.env;

const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL);
const deployerWallet = new ethers.Wallet(DEPLOYER_KEY);

// This block will come from DynamoDB last checkpoint block
const originBlock = 10730324;

let companyERCTokenDeployedTopic = ethers.utils.id("CompanyERCTokenDeployed(string,address)");
let vestingWalletAddedTopic = ethers.utils.id("VestingWalletAdded(address)");

const eco = new ethers.Contract(
    CONTRACT_ADDRESS,
    ECO.abi,
    provider
);

module.exports.handler = async (event, context, callback) => {
    const currentBlockNumber = await provider.getBlockNumber();    
    console.log('origin block', originBlock, 'current block', currentBlockNumber);            

    let filter = {
        address: CONTRACT_ADDRESS,
        fromBlock: originBlock,
        toBlock: currentBlockNumber,
        topics: [ 
            
        ]
    }
    
    let events = [];
    const logs = await provider.getLogs(filter);
    logs.forEach((log) => {
        const eventData = eco.interface.parseLog(log);
        
        let storeEvent = {};            
        if(eventData.name === 'CompanyERCTokenDeployed'){
            storeEvent.name = eventData.name,
            storeEvent.data = {
                tokenName: eventData.args[0],
                tokenAddress: eventData.args[1]
            };
        }else if(eventData.name === 'VestingWalletAdded'){
            storeEvent.name = eventData.name,
            storeEvent.data = {
                company: eventData.args[0]                    
            };
        }
        
        // Save the event log data in DDB
        // console.log(storeEvent);
        events.push(storeEvent);
    });

    console.log(events);        
};

// eco.on("VestingWalletAdded", async (address, e) => {
//     console.log('new vesting wallet added', address, e);
// });