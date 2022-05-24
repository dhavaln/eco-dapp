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
    mapping(address => VestingManager) public companies;
    address[] allCompanies;     
    
    // Store ERC20 token address for a company token
    mapping(string => address) public companyERC20;
    uint128 public totalCompanies;

    event VestingWalletAdded(address company);
    event CompanyERCTokenDeployed(string tokenName, address tokenAddress);

    constructor(){
        _owner = msg.sender;
    }

    function createCompany(string memory company, address tokenAddress) external returns (bool) {
        // Check if VestingManager wallet already exist or not
        // require(companies[msg.sender].isWalletAvailable() == false, "Vesting wallet already exist.");

        // Create a Vesting Wallet for the callee wallet
        companies[msg.sender] = new VestingManager(company, msg.sender, tokenAddress);
        allCompanies.push(address(companies[msg.sender]));
        totalCompanies++;

        // Emit VestingWallet Added Event
        emit VestingWalletAdded(msg.sender);

        return true;
    }

    // Allows a company to deploy an ERC20 token through ECO contract
    function createCompanyERC(string memory companyName, string memory tokenName, uint256 totalSupply) external returns (address) {
        // Check if ERC20 token already exist or not
        require(companyERC20[tokenName] == 0x0000000000000000000000000000000000000000, "Company ERC20 tokens already exist.");

        CompanyERC erc20 = new CompanyERC(msg.sender, companyName, tokenName, totalSupply);
        companyERC20[tokenName] = address(erc20);

        // Emit Company ERC20 Token Deployed Event
        emit CompanyERCTokenDeployed(tokenName, address(erc20));

        return address(erc20);
    }

    function getAllCompanies() external view returns (address[] memory) {
        return allCompanies;
    }

    function getCompanyERC20Address(string memory tokenName) external view returns (address) {
        return companyERC20[tokenName];
    }    
}