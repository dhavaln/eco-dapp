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
    bool public isActive;

    struct MemberAllotment {
        bool isComplete;
        bool isPaused;

        uint256 totalTokensAllotted;
        uint256 totalTokensTransferred;        

        // Accept a custom schedule with % and time range array
        // Make sure the tokensAlloted total is 100% and length of both arrays are same
        uint256[] tokensAlloted;
        uint256[] transferSchedule;        
    }    

    // Keep all member allotments and also the reference in array for easy iteration
    mapping(address => MemberAllotment) public allotments;
    address[] public allMembers;

    event MemberAdded(address indexed to, uint256 tokens);
    event MemberTokensVested(address indexed to, uint256 tokens, bool isComplete);
    event MemberTokenAllotmentPaused(address indexed to);
    event MemberTokenAllotmentResumed(address indexed to);

    constructor(string memory company, address walletAddress, address tokenAddress){
        owner = walletAddress;
        companyName = company;
        companyERC20 = tokenAddress;
        isActive = true;
    }

    modifier ownerOnly {
        require(msg.sender == owner, "You are not the company owner.");
        _;
    }

    modifier isVestingActive {
        require(isActive == true, "Vesting plan is inactive");
        _;
    }

    function pauseAllVesting() external ownerOnly {
        isActive = false;
    }

    function resumeAllVesting() external ownerOnly {
        isActive = true;
    }
    
    // This method will accept a custom schedule that is easy to follow
    // For a one time transfer the totalTokens = N, tokensSplit = [100] and timeSchedule = [future time]
    // For an equal split in 4 parts the totalTokens = N, tokenSplit = [25,25,25,25] and timeSchedule = [future1, future2, future3, future4]
    // This way we can build any kind of custom schedule
    // All the input params will be pre-calculated from UI side and validated in the function    
    function allocateTokens(address to, uint256 tokens, uint256[] memory tokenAllotment, uint256[] memory transferSchedule) external ownerOnly returns (bool) {        
        // Check ERC20 Token Balance        
        // Transfer the Tokens to current contract
        MemberAllotment storage _lot = allotments[to];
        _lot.totalTokensAllotted = 0; // total vesting tokens for entire schedule
        _lot.totalTokensTransferred = 0;
        _lot.isComplete= false;
        _lot.isPaused= false;        
        _lot.tokensAlloted = new uint256[](tokenAllotment.length);
        // _lot.transferSchedule = new uint256[](transferSchedule.length);

        // Direct assignment is not working
        // _lot.tokensAlloted = tokenAllotment; 
        // _lot.transferSchedule = transferSchedule;

        for(uint8 i = 0; i < tokenAllotment.length; i++){            
            _lot.totalTokensAllotted += tokenAllotment[i];

            // Value copy from one array to another array not working
            _lot.tokensAlloted[i] = tokenAllotment[i];

            // Pushing values to the array is also not working
            _lot.transferSchedule.push(transferSchedule[i]);
        }

        if(allotments[to].totalTokensAllotted != tokens){
            delete allotments[to];
            revert("Token allotment is not matching with total tokens.");
        }

        allMembers.push(to);
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
        require(!memberAllotment.isPaused, "Allotment is paused.");
        
        // This is a simple transfer. This will be replaced with custom schedule for simplicity.
        for(uint8 i = 0; i < memberAllotment.transferSchedule.length ; i++){
            // Check for previously vesting tokens
            if(memberAllotment.tokensAlloted[i] > 0){

                // Check for the current vested tokens
                if(block.timestamp > memberAllotment.transferSchedule[i]){
                    
                    memberAllotment.totalTokensAllotted -= memberAllotment.tokensAlloted[i];
                    memberAllotment.totalTokensTransferred += memberAllotment.tokensAlloted[i];
                    memberAllotment.tokensAlloted[i] = 0;

                    // Check if all tokens are transferred
                    if(memberAllotment.totalTokensAllotted == 0){
                        memberAllotment.isComplete = true;

                        // Emit full vesting event
                    }

                    emit MemberTokensVested(to, memberAllotment.totalTokensTransferred, memberAllotment.isComplete);
                }else{
                    revert("Tokens are still within the vesting period. Please check the vesting schedule.");
                }
            }            
        }        

        return true;
    }

    function getAllotedMembers() external view returns (address[] memory) {
        return allMembers;
    }
}