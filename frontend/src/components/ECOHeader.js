import React from "react";
import { WalletAddress } from "./WalletAddress";

export function ECOHeader({ currentWallet, totalECO, showAllWallets }) {
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
                { totalECO > 0 ? <a href="#" onClick={ showAllWallets } style={{textDecoration: "underline"}}>Total Wallets under ECO: <b>{ totalECO }</b></a> : ''}
              </div>
            </div>              
          </div>
        </div>

        <hr/>
    </div>
  );
}
