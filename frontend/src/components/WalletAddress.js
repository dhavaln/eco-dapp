import React from "react";
import { FaRegCopy } from 'react-icons/fa';

export function WalletAddress({ label, address }) {
  return (
    <span>
      { label }: <b>{address.substr(0, 5)}...{address.substr(address.length - 4)} <FaRegCopy onClick={() => navigator.clipboard.writeText(address)}/></b>
    </span>
  );
}
