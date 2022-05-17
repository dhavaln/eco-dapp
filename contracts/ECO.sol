// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

import "./VestingManager.sol";
import "./CompanyERC.sol";

/** 
 * @title ECO
 * @dev This is the main contract for the ECO Vesting Manager
 */
contract ECO {
    address _owner;
    
    // Store company vesting contracts
    mapping(string => VestingManager) public companies;
    address[] allCompanies; 
    uint128 public totalCompanies;
    
    event CompanyAdded(string);
    event CompanyERCTokenDeployed(string tokenName, address tokenAddress);

    constructor(){
        _owner = msg.sender;
    }

    function createCompany(string memory company, address tokenAddress) external returns (bool) {
        companies[company] = new VestingManager(company, msg.sender, tokenAddress);
        allCompanies.push(address(companies[company]));
        totalCompanies++;

        emit CompanyAdded(company);

        return true;
    }

    // Allows a company to deploy an ERC20 token through ECO contract
    function createCompanyERC(string memory companyName, string memory tokenName, uint256 totalSupply) external returns (address) {
        CompanyERC erc20 = new CompanyERC(msg.sender, companyName, tokenName, totalSupply);

        emit CompanyERCTokenDeployed(tokenName, address(erc20));

        return address(erc20);
    }

    function getAllCompanies() external view returns (address[] memory) {
        return allCompanies;
    }
}