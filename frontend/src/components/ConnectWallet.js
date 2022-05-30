import React from "react";

import { NetworkErrorMessage } from "./NetworkErrorMessage";

export function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <div className="container p-4">      
      <div className="row justify-content-md-center">        
        <div className="col-12 text-center">
          <h1 style={{ textAlign: "left"}}>
                  ECO - Employee Coin Ownership
          </h1>
          <hr/>
          <div className="alert alert-primary" role="alert" style={{ textAlign: "left"}}>
            This contract is LIVE on Rinkeby testnet. Please check your MetaMask account before making any transactions.
          </div>
          {/* Metamask network should be set to Localhost:8545. */}
          {networkError && (
            <NetworkErrorMessage 
              message={networkError} 
              dismiss={dismiss} 
            />
          )}
        </div>
        <div className="col-12 text-center">          
          <div style={{ padding: '10px', textAlign: 'center'}}>
            <img src="./eco-header.svg" width="90%"></img>                
            <hr/>
          </div>
          <button
            className="btn btn-warning"
            type="button"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
