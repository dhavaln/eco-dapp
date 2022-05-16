// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

import "./VestingManager.sol";

/** 
 * @title ECO
 * @dev This is the main contract for the ECO Vesting Manager
 */
contract ECO {
    address _owner;
    mapping(string => VestingManager) public companies;
    uint128 public totalCompanies;

    event CompanyAdded(string);

    constructor(){
        _owner = msg.sender;
    }

    function createCompany(string memory company, address tokenAddress) external returns (bool) {
        companies[company] = new VestingManager(company, msg.sender, tokenAddress);
        totalCompanies++;

        emit CompanyAdded(company);

        return true;
    }
}