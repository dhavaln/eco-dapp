import React from "react";

export function WalletAddress({ label, address }) {
  return (
    <span>
      { label }: <b>...{address.substr(address.length - 5)}</b>
    </span>
  );
}
