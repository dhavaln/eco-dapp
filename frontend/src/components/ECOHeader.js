import React from "react";
import { WalletAddress } from "./WalletAddress";

const networks = {
  4: {
    label: 'Rinkeby',
    url: 'https://rinkeby.etherscan.io/address/'
  } 
};

export function ECOHeader({ network, currentWallet, totalECO, showAllWallets, ecoAddress }) {
  return (
    <div>
        <div className="row">
          <div className="col-12">
            <h1 style={{ textAlign: "left"}}>
              ECO - Employee Coin Ownership
            </h1>
            <hr/>
            <div class="alert alert-primary" role="alert">
              This contract is LIVE on Rinkeby testnet. Please check your MetaMask account before making any transactions.
            </div>
            <div className="row">
              <div className="col">                
                <WalletAddress address={ currentWallet } label={"Your Wallet"} />
              </div>              
              <div className="col text-right">                                
                <WalletAddress address={ ecoAddress} label={ "ECO Address" }/>                  
                &nbsp;<a className="badge badge-success" target="_blank" href={ networks[network] ? networks[network].url + ecoAddress : '#' }>{ networks[network].label || 'Unknown' }</a>&nbsp;
                {/* { totalECO > 0 ? <span>&nbsp;|&nbsp;<a href="#" onClick={ showAllWallets } style={{textDecoration: "underline"}}>Total Wallets under ECO: <b>{ totalECO }</b></a></span> : ''} */}
              </div>
            </div>              
          </div>
        </div>

        <hr/>
    </div>
  );
}
