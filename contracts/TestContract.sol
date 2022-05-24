//SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

contract TestContract {
    uint256 num; 
    address owner_;
    string public constant name = "TestContract";

    modifier onlyOwner{
        require(owner_ == msg.sender);
        _;
    }

    constructor(){
        owner_ = msg.sender;
    }

    function set(uint256 val) external onlyOwner{
        num = val;
    }

    function getNum() external view returns(uint256){
        return num;
    }
}
