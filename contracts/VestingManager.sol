// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

/** 
 * @title VestingManager
 * @dev This contract holds the company and employee token allocations
 */
contract VestingManager {
    // Owner by default will be the Company who will provide the wallet address
    address public owner;
    
    string public companyName;

    // ERC20 Token address
    address public companyERC20;

    // This is the kill switch to kind of enable/disable the working of Vesting
    bool isActive;

    struct MemberAllotment {
        uint256 tokensAllotted;
        uint256 tokensTransferred;
        uint256 transferOn; // Seconds in future
        bool isComplete;
        bool isPaused;
    }    

    mapping(address => MemberAllotment) public allotments;

    event MemberAdded(address indexed to, uint256 tokens);
    event MemberTokensVested(address indexed to, uint256 tokens, bool isComplete);
    event MemberTokenAllotmentPaused(address indexed to);
    event MemberTokenAllotmentResumed(address indexed to);

    constructor(string memory company, address walletAddress, address tokenAddress){
        owner = walletAddress;
        companyName = company;
        companyERC20 = tokenAddress;
    }

    modifier ownerOnly {
        require(msg.sender == owner, "You are not the company owner.");
        _;
    }

    function allocateTokens(address to, uint256 tokens, uint256 transferOn) external ownerOnly returns (bool) {        
        // Check ERC20 Token Balance
        // Transfer the Tokens to current contract

        // Save the allotment into struct mapping
        allotments[to] = MemberAllotment({
            tokensAllotted: tokens, 
            transferOn: block.timestamp + transferOn,             
            tokensTransferred: 0,
            isComplete: false, 
            isPaused: false
        });

        emit MemberAdded(to, tokens);

        return true;
    }

    function checkERCTokenBalance(uint256 forTokens) internal {        
    }

    function transferTokens(address to, uint56 tokens) internal {
    }

    function resumeAllotment(address to) external ownerOnly returns (bool) {
        // Check member allotment
        
        MemberAllotment storage memberAllotment = allotments[to];
        require(!memberAllotment.isComplete, "Allotment already completed.");
        require(!memberAllotment.isPaused, "Allotment already paused.");

        memberAllotment.isPaused = false;

        emit MemberTokenAllotmentResumed(to);        
        return true;
    }

    function pauseAllotment(address to) external ownerOnly returns (bool) {
        // Check member allotment
        
        MemberAllotment storage memberAllotment = allotments[to];
        require(!memberAllotment.isComplete, "Allotment already completed.");
        require(!memberAllotment.isPaused, "Allotment already paused.");

        memberAllotment.isPaused = true;

        emit MemberTokenAllotmentPaused(to);        
        return true;
    }

    function releaseTokens(address to) external ownerOnly returns (bool) {
        // Check member allotment
        
        MemberAllotment storage memberAllotment = allotments[to];
        require(!memberAllotment.isComplete, "Allotment already completed.");
        
        if(block.timestamp > memberAllotment.transferOn){
            memberAllotment.isComplete = true;
            memberAllotment.tokensTransferred = memberAllotment.tokensAllotted;
            memberAllotment.tokensAllotted = 0;

            emit MemberTokensVested(to, memberAllotment.tokensTransferred, memberAllotment.isComplete);
        }else{
            revert("Tokens are still within the vesting period. Please check the vesting schedule.");
        }

        return true;
    }
}