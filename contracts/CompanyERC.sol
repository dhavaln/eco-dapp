// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CompanyERC is ERC20 {

    constructor (address tokenOwner, string memory companyName, string memory tokenName, uint256 totalSupply) ERC20(companyName, tokenName) {
        _mint(tokenOwner, totalSupply * (10 ** uint256(decimals())));
    }
}