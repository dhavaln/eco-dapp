import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { Contract, ethers, utils } from "ethers";

// Import Contract ABIs add chain address
import ECO from "../contracts/ECOContract.json";
import VestingManager from "../contracts/VestingManager.json";
import CompanyERC from "../contracts/CompanyERC.json";
import IERC20 from '../contracts/IERC20.json';

import contractAddress from "../contracts/contract-address.json";

// UI Components
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { WalletAddress } from "./WalletAddress";
import { ECOHeader } from "./ECOHeader";

import CreateERC20Modal from "./CreateERC20Modal";
import CreateVestingManagerModal from "./CreateVestingManagerModal";
import AddWalletMemberModal from "./AddWalletMemberModal";

// This is the Hardhat Network id, you might change it in the hardhat.config.js.
// If you are using MetaMask, be sure to change the Network id to 1337.
// Here's a list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
// to use when deploying to other networks.
const HARDHAT_NETWORK_ID = '31337';

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of doing these things:
//   1. Connects to the user's wallet
//   2. Initializes the test contract
//   3. Renders the whole application
export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    this.initialState = {
      // Company VestingManager
      vestingManager: undefined,      
      hasERC20: false,
      hasVestingWallet: false,

      vestingWalletTokenBalance: 0,

      // The info of the test contract (i.e. It's Name)
      testContractData: undefined,
      balance: undefined,

      // The user's address and balance
      selectedAddress: undefined,      
      networkError: undefined,

      showERC20Modal: false,
      showVestingManagerModal: false,
      showAddMemberModal: false
    };

    this.state = this.initialState;
  }

  createVestingManager = async ({name, erc20Address}) => {
    if(!this.state.erc20) return;
    if(!name || !erc20Address) return;

    console.log(name, erc20Address);

    // Create the VestingManager with given company name and ERC20 address
    await this._eco.createCompany(name, erc20Address);

    this.setState({
      showVestingManagerModal: false
    });
  }

  createERC20Token = async ({ name, symbol, totalSupply }) => {
    if(!name || !symbol || totalSupply <= 0) return;

    console.log(name, symbol.toUpperCase(), totalSupply);
    await this._eco.createCompanyERC(name, symbol.toUpperCase(), totalSupply);    

    this.setState({
      showERC20Modal: false
    });
  }

  addMemberInVesting = async ({ address, totalTokens, transferOn }) => {
    // await this._vestingWallet.allocateTokens()
    console.log(address, totalTokens, transferOn);

    this.setState({
      showAddMemberModal: false
    })
  }

  transferERC20Tokens = async () => {

  }

  showAddMember = (isShow) => {
    this.setState({
      showAddMemberModal: isShow
    })
  };

  showVestingManager = (isShow) => {
    this.setState({
      showVestingManagerModal: isShow
    });
  };

  showCreateTokenPopup = (isShow) => {    
    this.setState({
      showERC20Modal: isShow
    });
  }

  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install MetaMask.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    // The next thing we need to do, is to ask the user to connect their wallet.
    // When the wallet gets connected, we are going to save the users's address
    // in the component's state. So, if it hasn't been saved yet, we have
    // to show the ConnectWallet component.
    //
    // Note that we pass it a callback that is going to be called when the user
    // clicks a button. This callback just calls the _connectWallet method.
    if (!this.state.selectedAddress) {
      if(window.ethereum){
        this._connectWallet()
        return (<div></div>);
      }

      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // Show loader until the state is fully initialized.
    if (!this.state.testContractData) {
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <ECOHeader currentWallet={ this.state.selectedAddress } totalECO={ this.state.allCompanies ? this.state.allCompanies.length : 0 }/>

        <CreateERC20Modal show={this.state.showERC20Modal} onClose={this.showCreateTokenPopup} onCreate={ this.createERC20Token }/>
        <CreateVestingManagerModal name={ this.state.ercCompany } erc20Address={this.state.erc20} show={this.state.showVestingManagerModal} onClose={this.showVestingManager} onCreate={this.createVestingManager} />
        <AddWalletMemberModal show={this.state.showAddMemberModal} onClose={this.showAddMember} onCreate={ this.addMemberInVesting } />

        <div className="container">          
          <div className="card-deck mb-3 text-center">
              <div className="card mb-8 box-shadow">
                <div className="card-header">
                  <h4 className="my-0 font-weight-normal">
                    Vesting Wallet                    
                  </h4>
                </div>
                <div className="card-body">                  
                  {
                    !this.state.hasVestingWallet 
                    ? <ul className="list-unstyled mt-3 mb-4">
                        <li>We can help you setup a Blockchain-based secure and periodic token transfers to your employees and contributors.</li>                  
                      </ul>
                    : <ul className="list-unstyled mt-3 mb-4">
                        <WalletAddress address={ this.state.vestingWalletAddr } label={"Wallet Address"} />
                        <li>Wallet Status: <b>{ this.state.vestingActive ? 'ACTIVE' : 'INACTIVE' }</b></li>                        
                      </ul>
                  }

                  {
                    this.state.hasVestingWallet 
                    ? <table className="table">
                        <thead>
                          <tr>
                            <th scope="col">{this.state.vestingMembers.length} Member(s)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {/* <td scope="col">
                              <WalletAddress address={ this.state.vestingWalletAddr } label={"Wallet"}/><span className="badge badge-primary">Active</span><br/>
                              Tokens Alloted: <b>1,000,000</b><br/>, Tokens Transferred: <b>5,00,000</b><br/>
                              Next Release: 22 May 2022<br/>
                            </td> */}
                          </tr>
                        </tbody>
                      </table>
                    : ''
                  }
                  <hr/>
                  { !this.state.hasVestingWallet ? <button type="button" className="btn btn-lg btn-block btn-primary" onClick={()=>this.showVestingManager(true)}>Create a Wallet</button> : ''}
                  { this.state.hasVestingWallet && this.state.vestingActive ? <button type="button" className="btn btn-lg btn-block btn-primary" onClick={()=>this.showAddMember(true)}>Add Member</button> : ''}
                </div>
              </div>

              <div className="card mb-4 box-shadow">
                <div className="card-header">                  
                  <h4 className="my-0 font-weight-normal">{ this.state.hasERC20 ? 'Your Tokens' : 'Don\'t have Tokens'}</h4>
                </div>              
                <div className="card-body">                
                  {
                    !this.state.hasERC20 
                      ? <ul className="list-unstyled mt-3 mb-4"> 
                          <li>Don't have your company tokens on Blockchain yet!! We can help you create and deploy your company tokens transparently. </li>
                        </ul>
                      : <ul className="list-unstyled mt-3 mb-4">                        
                          <li><WalletAddress address={ this.state.erc20 } label={"Token Address"}/></li>
                          <li>&nbsp;</li>
                          <li>Company: <b>{ this.state.ercCompany }</b> | Token Symbol: <b>{ this.state.ercSymbol } </b></li>
                          <li>Total Supply: <b>{ this.state.ercTotalSupply }</b> | Remaining Tokens: <b>{ this.state.ercBalance }</b></li>
                          <li style={{color: "red"}}>VestingWallet Balance: <b>{ this.state.vestingWalletTokenBalance }</b></li>
                          
                        </ul>
                  }                  

                  { !this.state.hasERC20 ? <button type="button" className="btn btn-lg btn-block btn-success" onClick={()=>this.showCreateTokenPopup(true)}>Create Tokens</button> : '' }
                  { this.state.hasERC20 ? <button type="button" className="btn btn-lg btn-block btn-success" onClick={()=>this.transferERC20Tokens()}>Transfer Tokens to Wallet</button> : '' }
                </div>
              </div>
            </div>
          </div>
      </div>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {    
    // Generic Wallet Connector
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Once we have the address, we can initialize the application.

    // First we check the network
    if (!this._checkNetwork()) {
      return;
    }

    // Init the state
    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
    
    // We reset the dapp state if the network is changed
    window.ethereum.on("chainChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {    
    // This method initializes the dapp
    console.log(userAddress);

    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    // Then, we fetch the contract's data
    this._initializeEthers();
    this._getContractData();
    this._startPollingData();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    console.log("ECO Contract Address", contractAddress.ECOContract);

    // Then, we initialize the contract using that provider and the contract's artifact.    
    this._eco = new ethers.Contract(
      contractAddress.ECOContract,
      ECO.abi,
      this._provider.getSigner(0)
    );

    let filter = {
        address: contractAddress.ECOContract,
        topics: [
            utils.id("CompanyERCTokenDeployed(string,string)")
        ]
    };

    this._provider.on(filter, (log) => {
      console.log('event received', log);
    });
  }

  // This is added just for the testing purpose.
  _startPollingData() {
    // this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);
    // // We run it once immediately so we don't have to wait for it
    // this._updateBalance();
  }

  async _updateBalance() {
    // const balance = await this._testContract.balanceOf(this.state.selectedAddress);
    // this.setState({ balance });
  }

  // Stop the data polling, added for testing purpose only.
  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _getContractData() {    
    
    let allCompanies = await this._eco.getAllCompanies();
    console.log('all companies', allCompanies);

    // Replace this to find ERC20 token based on selected address
    let erc20 = 0x0000000000000000000000000000000000000000;
    let hasERC20 = false;

    // Reaplce this to find VestingManager for the current address
    let vestingWalletAddr = await this._eco.companies( this.state.selectedAddress );
    console.log('vesting wallet address', vestingWalletAddr);

    if(vestingWalletAddr != 0x0000000000000000000000000000000000000000){
      this.state.hasVestingWallet = true;
      this.state.vestingWalletAddr = vestingWalletAddr;

      this._vestingWallet = new ethers.Contract(
        vestingWalletAddr,
        VestingManager.abi,
        this._provider.getSigner(0)
      );

      this.state.vestingMembers = await this._vestingWallet.getAllotedMembers();
      this.state.vestingActive = await this._vestingWallet.isActive();
      erc20 = await this._vestingWallet.companyERC20();
      hasERC20 = true;
    }
    
    if(erc20 != 0x0000000000000000000000000000000000000000){
      hasERC20 = true;

      this._erc20 = new ethers.Contract(
        erc20,
        // IERC.abi // I can't access name() and symbol() with this
        CompanyERC.abi,
        this._provider.getSigner(0)
      );

      this.state.ercCompany = await this._erc20.name();
      this.state.ercSymbol = await this._erc20.symbol();
      this.state.ercTotalSupply = (await this._erc20.totalSupply()).toString();
      this.state.ercBalance = (await this._erc20.balanceOf( this.state.selectedAddress )).toString();      

      this.state.vestingWalletTokenBalance = (await this._erc20.balanceOf( this.state.vestingWalletAddr )).toString();
    }
    
    const name = "test-name";
    this.setState({ 
      testContractData: { name },
      allCompanies,
      hasERC20,
      erc20
    });
  }  

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545 
  _checkNetwork() {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect Metamask to Localhost:8545'
    });

    return false;
  }
}
