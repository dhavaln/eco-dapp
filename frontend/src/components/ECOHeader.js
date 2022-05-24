import React from "react";
import { WalletAddress } from "./WalletAddress";

export function ECOHeader({ currentWallet, totalECO, showAllWallets, ecoAddress }) {
  return (
    <div>
        <div className="row">
          <div className="col-12">
            <h1 style={{ textAlign: "left"}}>
              ECO - Employee Coin Ownership
            </h1>
            <hr/>
            <div className="row">
              <div className="col">                
                <WalletAddress address={ currentWallet } label={"Your Wallet"} />
              </div>
              <div className="col text-right">
                  <WalletAddress address={ ecoAddress} label={ "ECO Address" }/>
                { totalECO > 0 ? <span>&nbsp;|&nbsp;<a href="#" onClick={ showAllWallets } style={{textDecoration: "underline"}}>Total Wallets under ECO: <b>{ totalECO }</b></a></span> : ''}
              </div>
            </div>              
          </div>
        </div>

        <hr/>
    </div>
  );
}
