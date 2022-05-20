import React from "react";
import { WalletAddress } from "./WalletAddress";

export function ECOHeader({ currentWallet, totalECO }) {
  return (
    <div>
        <div className="row">
          <div className="col-12">
            <h1>
              ECO - Employee Coin Ownership
            </h1>                      

            <div className="row">
              <div className="col">                
                <WalletAddress address={ currentWallet } label={"Your Wallet"} />
              </div>
              <div className="col text-right">
                Total Wallets under ECO: <b>{ totalECO }</b>
              </div>
            </div>              
          </div>
        </div>

        <hr/>
    </div>
  );
}
