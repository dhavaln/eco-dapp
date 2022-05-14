

// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

// import "@openzeppelin/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract VestingManager {

    address private _owner;
    address private _token_addr;
    address private _maintainer;
    struct vestinginfo {
        uint64 allocation;
        uint64 duration;
        uint64 start_time;
        uint64 period;
    }
    mapping (address => vestinginfo) private empl_vesting_info;
    mapping (address => uint64) private vested;

    constructor(address token_addr, address maintainer) {
        require(token_addr != address(0), "Error: token_address is zero address");
        _owner = msg.sender;
        _token_addr = token_addr;
        _maintainer = maintainer;
        }

    receive() external payable virtual {}

    modifier ownersOnly() {
        require(msg.sender == _owner, "Error: ONLY_OWNERS_ALLOWED");
        _;
    }

    modifier maintainerOnly() {
        require(msg.sender == _maintainer, "Error: ONLY_MAINTAINERS_ALLOWED");
        _;
    }

    function add_employee(address addr, uint64 allocation, uint64 duration, uint64 start_time, uint64 period) external ownersOnly{
        vestinginfo memory v = vestinginfo(allocation, duration, start_time, period);
        empl_vesting_info[addr] = v;
    }

    function release(address addr) external {
        uint64 releasable = vestedAmount(addr) - released(addr);
        // SafeERC20.safeTransfer(IERC20(_token_addr), addr, releasable);
        vested[addr] += releasable;
    }

    function vestedAmount(address addr) public view returns (uint64) {
        if (block.timestamp < empl_vesting_info[addr].start_time)
            return uint64(0);
        if (block.timestamp > empl_vesting_info[addr].start_time + empl_vesting_info[addr].duration)
            return empl_vesting_info[addr].allocation;
        return uint64((uint64(block.timestamp) - empl_vesting_info[addr].start_time) / empl_vesting_info[addr].period) * (empl_vesting_info[addr].allocation / (empl_vesting_info[addr].duration / empl_vesting_info[addr].period));
    }

    function released(address addr) public view returns (uint64) {
        return vested[addr];
    }

    function get_grant_details(address addr) external view returns (uint64, uint64, uint64, uint64) {
        return (empl_vesting_info[addr].allocation, empl_vesting_info[addr].duration, empl_vesting_info[addr].start_time, empl_vesting_info[addr].period);
    }

    function get_token_address() external view returns (address) {
        return _token_addr;
    }

    function get_owner() external view returns (address) {
        return _owner;
    }


}
