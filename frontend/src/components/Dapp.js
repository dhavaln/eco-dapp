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
import TokanTransferModal from "./TokanTransferModal";
import MessageModal from "./MessageModal";

// This is the Hardhat Network id, you might change it in the hardhat.config.js.
// If you are using MetaMask, be sure to change the Network id to 1337.
// Here's a list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
// to use when deploying to other networks.
const HARDHAT_NETWORK_ID = '31337';
const RINKEBY_NETWORK_ID = '4';

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
      showAddMemberModal: false,
      showTokenTransferModal: false,
      showMessageModal: false,

      tokenSymbol: undefined,
      currentBlockNumber: 0
    };

    this.state = this.initialState;
  }

  onCreate = () => {
    this.props.onCreate({...this.state});
  }

  onChange =(fname) =>(event) => {
      const{value}=event.target;

      this.setState({
          [fname]:value
      });
  }

  createVestingManager = async ({name, erc20Address}) => {    
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
    if(!address || totalTokens <= 0) return;

    let transferOnEpoch = new Date(transferOn).getTime() / 1000;
    if(transferOnEpoch <= (Date.now()/1000)) return;

    console.log('ready to add member');
    try{
      await this._vestingWallet.allocateTokens( address, totalTokens, [totalTokens], [transferOnEpoch]);
    }catch(e){
      this.setState({
        messageTitle: 'Allocation Error',
        messageText: e.data.data.message,
        showMessageModal: true
      });
    }

    this.setState({
      showAddMemberModal: false
    })
  }

  initTokenTransfer = async ({ tokens }) => {
    if(tokens <= 0) return;
    if(tokens > this.state.ercBalance) return;

    console.log(tokens);
    
    await this._erc20.transfer( this.state.vestingWalletAddr, tokens);

    this.setState({
      showTokenTransferModal: false
    });
  }

  releaseVestedTokens = async ( address ) => {
    console.log(address);

    try{
      await this._vestingWallet.releaseTokens( address );
    }catch(e){
      this.setState({
        messageTitle: 'Transaction Error',
        messageText: e.error.message,
        showMessageModal: true
      });

      console.log(e.error);
    }
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

  showTokanTransfer = (isShow) => {
    this.setState({
      showTokenTransferModal: isShow
    })
  };

  showTokenTransfer = (isShow) => {    
    this.setState({
      showTokenTransferModal: isShow
    });
  }

  showMessageModal = (isShow) => {    
    this.setState({
      showMessageModal: isShow
    });
  }

  showAllWallets = () => {
    console.log('show all vesting wallet in the model list');

    this.setState({
      messageTitle: 'Vesting Wallets',
      messageText: this.state.allCompanies.map( (addr) => `Wallet: ${addr}\n\n`),
      showMessageModal: true
    });
  }

  loadTokenAddress = async () => {
    console.log(this.state.tokenSymbol);
    if(!this.state.tokenSymbol) return;

    let erc20 = await this._eco.getCompanyERC20Address(this.state.tokenSymbol);
    
    if(erc20 != 0x0000000000000000000000000000000000000000){
      this._erc20 = new ethers.Contract(
        ethers.utils.getAddress(erc20),
        // IERC.abi // I can't access name() and symbol() with this
        CompanyERC.abi,
        this._provider.getSigner(0)
      );
        
      this.state.ercCompany = await this._erc20.name();
      this.state.ercSymbol = await this._erc20.symbol();
      
      this.setState({
        foundERC20: `Wallet Address: ${erc20}`
      });
    }else{
      this.setState({
        foundERC20: 'Could not find any token for this symbol.'
      });
    }
  }

  componentDidMount(){
    if(window.ethereum){
      this._connectWallet();      
    }
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
        <ECOHeader network={window.ethereum.networkVersion} ecoAddress={contractAddress.ECOContract} currentWallet={ this.state.selectedAddress } totalECO={ this.state.allCompanies ? this.state.allCompanies.length : 0 } showAllWallets={ this.showAllWallets }/>

        <CreateERC20Modal show={this.state.showERC20Modal} onClose={this.showCreateTokenPopup} onCreate={ this.createERC20Token }/>
        <CreateVestingManagerModal name={ this.state.ercCompany } erc20Address={this.state.erc20} show={this.state.showVestingManagerModal} onClose={this.showVestingManager} onCreate={this.createVestingManager} />
        <AddWalletMemberModal show={this.state.showAddMemberModal} onClose={this.showAddMember} onCreate={ this.addMemberInVesting } />
        <TokanTransferModal show={this.state.showTokenTransferModal} onClose={this.showTokanTransfer} onCreate={ this.initTokenTransfer} />
        <MessageModal show={this.state.showMessageModal} title={ this.state.messageTitle} message={ this.state.messageText} onClose={this.showMessageModal}/>

        <div className="container">
          {
            !this.state.hasVestingWallet ?
              <div style={{ padding: '10px', textAlign: 'center'}}>
                <img src="./eco-header.svg" width="90%"></img>
              </div> : ''
          }
          
          <div className="card-deck mb-3 text-center">              
              <div className="card mb-4 box-shadow">
                <div className="card-header">                  
                  <h4 className="my-0 font-weight-normal">
                  {
                    !this.state.hasERC20 ? 'Register ERC20 Tokens' : 'ERC20 Token'
                  }
                  </h4>
                </div>              
                <div className="card-body">
                  <div className="alert alert-primary">
                    An ERC20 Token contract holds the total amount of tokens in circulation. You can have 100, 1,000 or 1,000,000 tokens in circulation. Part of vesting process, you can only spend the un-used tokens.
                  </div>

                  {
                    !this.state.hasERC20 
                      ? <ul className="list-unstyled mt-3 mb-4"> 
                          <li>If you don't have an ERC20 token contract on chain yet, we can help you create and deploy your own Token Contract without going through any technical process.</li>
                        </ul>
                      : <ul className="list-unstyled mt-3 mb-4">                        
                          <li><WalletAddress address={ this.state.erc20 } label={"Token Address"}/></li>
                          <li>&nbsp;</li>
                          <li>Company: <b>{ this.state.ercCompany }</b> | Token Symbol: <b>{ this.state.ercSymbol } </b></li>
                          <li>Total Supply: <b>{ this.state.ercTotalSupply }</b> | Remaining Tokens: <b>{ this.state.ercBalance }</b></li>                          
                        </ul>
                  }                  

                  { !this.state.hasERC20 ? <button type="button" className="btn btn-lg btn-block btn-success" onClick={()=>this.showCreateTokenPopup(true)}>Create Tokens</button> : '' }

                  { !this.state.hasERC20 ? <hr/> : ''}

                  {
                    !this.state.hasERC20 
                      ? <div>
                          <ul className="list-unstyled mt-3 mb-4"> 
                            <li>Already created your tokens through ECO? Enter your token symbol to fetch the address.</li>
                          </ul>

                          <form>
                            <div className="form-group">
                                <input type="text" className="form-control" id="tokenSymbol" aria-describedby="tokenSymbol" placeholder="Enter your Token symbol" value={ this.state.tokenSymbol } onChange={ this.onChange('tokenSymbol') } />
                            </div>
                            <div className="form-group">
                              { this.state.foundERC20 ? this.state.foundERC20 : ''}
                            </div>
                          </form>
                        </div> : ''
                  }
                  
                  { !this.state.hasERC20 ? <button type="button" className="btn btn-lg btn-block btn-warning" onClick={()=>this.loadTokenAddress()}>Check Token</button> : '' }

                  { this.state.hasERC20 ? <button type="button" className="btn btn-lg btn-block btn-success" onClick={()=>this.showTokenTransfer(true)}>Transfer Tokens to Wallet</button> : '' }
                </div>
              </div>

              <div className="card mb-8 box-shadow">
                <div className="card-header">
                  <h4 className="my-0 font-weight-normal">
                    { !this.state.hasVestingWallet ? 'Setup Vesting Wallet' : 'Your Vesting Wallet' }
                  </h4>
                </div>
                <div className="card-body">

                  <div className="alert alert-primary">
                    Vesting Wallet works as a custodian and scheduler for the token transfer. If you want to allocate X number of tokens to a member at a given point in time, you will have to transfer those X tokens first to the Vesting Wallet. This process ensures that the ERC20 can not over-allocate tokens to different addresses.
                  </div>

                  {
                    !this.state.hasVestingWallet 
                    ? <ul className="list-unstyled mt-3 mb-4">
                        <li>We can help you setup a Blockchain-based secure and periodic token transfers to your employees and contributors.</li>                  
                      </ul>
                    : <ul className="list-unstyled mt-3 mb-4">
                        <WalletAddress address={ this.state.vestingWalletAddr } label={"Address"} />
                        <li>Status: <b>{ this.state.vestingActive ? 'ACTIVE' : 'INACTIVE' }</b></li>
                        <li style={{color: "red"}}>Remaining Tokens In Wallet: <b>{ this.state.vestingWalletTokenBalance }</b></li>
                        {/* <li style={{color: "red"}}>Tokens In Vesting: <b>{ this.state.vestingWalletTokenBalance }</b></li> */}
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
                            { 
                              this.state.vestingMembersDetail.map(( member) => {
                                return <tr>
                                    { <td scope="col" style={{ padding: "0px"}}>
                                        <table style={{ textAlign: "left"}} className="table table-hover table-sm">
                                          <tbody>
                                          <tr>
                                            <td>
                                              <b>Member Address</b>
                                            </td>
                                            <td>
                                              <WalletAddress address={member.address} label={ "" }/>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td>
                                              Pending Tokens
                                            </td>
                                            <td>
                                              <b>
                                                { member.isComplete ? 
                                                    <span style={{color: 'green'}}>Vesting Completed</span> : 
                                                    <span>{member.totalTokensAllotted} ({(member.totalTokensAllotted * 100 / this.state.ercTotalSupply).toFixed(2)}%)</span>
                                                }
                                              </b>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td>
                                              Tokens Transferred
                                            </td>
                                            <td>
                                              <b>{member.totalTokensTransferred}</b>
                                            </td>
                                          </tr>
                                          {
                                            !member.isComplete ?
                                              <tr>
                                                <td>
                                                  Next Release
                                                </td>
                                                <td>
                                                  <b>{ member.nextRelease.toLocaleString() }</b>  { !member.isComplete ? <button variant="success" className="btn btn-success btn-sm" onClick={() => this.releaseVestedTokens(member.address)}>Release</button> : ''}
                                                </td>
                                              </tr>
                                              : ''
                                          }                                          
                                          </tbody>
                                        </table>
                                    </td> }
                                  </tr>
                              })
                            }
                        </tbody>
                      </table>
                    : ''
                  }
                  
                  { !this.state.hasVestingWallet ? <button type="button" className="btn btn-lg btn-block btn-primary" onClick={()=>this.showVestingManager(true)}>Create a Wallet</button> : ''}
                  { this.state.hasVestingWallet && this.state.vestingActive ? <button type="button" className="btn btn-lg btn-block btn-primary" onClick={()=>this.showAddMember(true)}>Add New Member</button> : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 my-md-3 pt-md-3 border-top">
            <div className="row">
              <div className="col-12 col-md">                                  
                <small className="d-block mb-3 text-muted"><a href="https://docs.google.com/document/d/1x1sZSLFmhvrtpAxK9tsguhjt-y-VMxNBtZVKxQYcvpc/edit#" target="_blank">ECO Whitepaper</a> / Get in touch / <a href="https://twitter.com/haque5farazul" target="_blank">@haque5farazul</a> / <a href="https://twitter.com/sanskar_107" target="_blank">@sanskar_107</a> / <a href="https://twitter.com/bakshim" target="_blank">@bakshim</a> / <a href="https://twitter.com/dhavaln" target="_blank">@dhavaln</a></small>
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
    console.log('FIRE ONCE: initializing ethers connection and events');
    
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log("ECO Contract Address", contractAddress.ECOContract);

    // Then, we initialize the contract using that provider and the contract's artifact.    
    this._eco = new ethers.Contract(
      contractAddress.ECOContract,
      ECO.abi,
      this._provider.getSigner(0)
    );

    this._eco.on("VestingWalletAdded", async (address, e) => {
      if(e.blockNumber > this.state.currentBlockNumber){
        // Refresh UI
        this._getContractData();
      }
    });
  
    this._eco.on("CompanyERCTokenDeployed", (tokenName, tokenAddress) => {
      console.log("token deployed event received", tokenName, tokenAddress);
    });

    let blockNumber = (await this._provider.getBlockNumber()).toString();
    console.log('current block number', blockNumber);
    this.setState({
      currentBlockNumber: blockNumber
    })
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

    this.state.hasVestingWallet = false;
    this.state.vestingWalletAddr = 0x0000000000000000000000000000000000000000;
    this._vestingWallet = undefined;

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

      this._vestingWallet.on("MemberAdded", (to, token, e) => {
        console.log("member added event received", to, token);
        if(e.blockNumber > this.state.currentBlockNumber){
          // Refresh UI
          this._getContractData();
        }
      });

      this._vestingWallet.on("MemberTokensVested", (to, token, isComplete) => {
        console.log("token vested event received", to, token, isComplete);
      });

      this.state.vestingMembers = await this._vestingWallet.getAllotedMembers();      

      this.state.vestingMembersDetail = await Promise.all(this.state.vestingMembers.map(async (member) => {
        let detail = await this._vestingWallet.getAllotmentFor( member );

        let nextRelease;

        detail[4].forEach( (val, index) => {
          if(val > 0 && !nextRelease){
            nextRelease = new Date(detail[5] * 1000);
          }
        });

        console.log(nextRelease);

        return {
          address: member,
          isComplete: detail[0],
          isPaused: detail[1],
          totalTokensAllotted: detail[2].toString(),
          totalTokensTransferred: detail[3].toString(),
          tokensAlloted: detail[4],
          transferSchedule: detail[5],
          nextRelease
        }
      }));
      console.log(this.state.vestingMembersDetail);

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
    
    let blockNumber = (await this._provider.getBlockNumber()).toString();

    const name = "test-name";
    this.setState({ 
      testContractData: { name },
      allCompanies,
      hasERC20,
      erc20,
      currentBlockNumber: blockNumber
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
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID || window.ethereum.networkVersion === RINKEBY_NETWORK_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect Metamask to Localhost:8545'
    });

    return false;
  }
}
