const ethers = require('ethers');
const ECO = require('./contracts/ECOContract.json');
const { CONTRACT_ADDRESS, DEPLOYER_KEY, NETWORK_URL } = require("./secrets.json");

const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL);
const deployerWallet = new ethers.Wallet(DEPLOYER_KEY);

// This block will come from DynamoDB last checkpoint block
const originBlock = 10730324;

provider.getBlockNumber()
.then((val) => {
    console.log('origin block', originBlock, 'current block', val);

    const eco = new ethers.Contract(
        CONTRACT_ADDRESS,
        ECO.abi,
        provider
    );

    let companyERCTokenDeployedTopic = ethers.utils.id("CompanyERCTokenDeployed(string,address)");
    let vestingWalletAddedTopic = ethers.utils.id("VestingWalletAdded(address)");
    
    let filter = {
        address: CONTRACT_ADDRESS,
        fromBlock: originBlock,
        toBlock: val,
        topics: [ 
            
        ]
    }
    
    let events = [];

    provider.getLogs(filter).then((logs) => {
        logs.forEach((log) => {
            const eventData = eco.interface.parseLog(log);
            // console.debug('raw event log data',eventData);

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
    });

    // Save the current block as a checkpoint in DDB    
});

// eco.on("VestingWalletAdded", async (address, e) => {
//     console.log('new vesting wallet added', address, e);
// });