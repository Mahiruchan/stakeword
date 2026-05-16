// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/StakeWordVault.sol";

contract MockUSDC is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (allowance[from][msg.sender] < type(uint256).max) {
            allowance[from][msg.sender] -= amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
}

contract StakeWordVaultTest is Test {
    StakeWordVault vault;
    MockUSDC usdc;
    address owner = address(0xA11CE);
    address keeper = address(0xBEEF);
    address staker = address(0xCAFE);

    function setUp() public {
        usdc = new MockUSDC();
        vm.prank(owner);
        vault = new StakeWordVault(address(usdc), keeper);
    }

    function _fundVault(uint256 amount) internal {
        usdc.mint(address(vault), amount);
    }

    function _record(bytes32 id, uint256 principal) internal {
        _fundVault(principal);
        vm.prank(keeper);
        vault.recordDeposit(id, staker, principal);
    }

    function testDepositBooksAccounting() public {
        _record(bytes32("c1"), 5_000_000);
        (address s, uint256 p, , StakeWordVault.Outcome o) = vault.commitments(bytes32("c1"));
        assertEq(s, staker);
        assertEq(p, 5_000_000);
        assertEq(uint256(o), uint256(StakeWordVault.Outcome.None));
        assertEq(vault.totalPooled(), 5_000_000);
    }

    function testDoubleRecordReverts() public {
        _record(bytes32("c1"), 5_000_000);
        _fundVault(5_000_000);
        vm.prank(keeper);
        vm.expectRevert(StakeWordVault.AlreadyRecorded.selector);
        vault.recordDeposit(bytes32("c1"), staker, 5_000_000);
    }

    function testSettleCompletedReturnsPrincipalToStaker() public {
        _record(bytes32("c1"), 5_000_000);
        vm.prank(keeper);
        vault.settleCompleted(bytes32("c1"));
        assertEq(usdc.balanceOf(staker), 5_000_000);
        assertEq(vault.totalPooled(), 0);
        assertEq(vault.totalSettledSuccess(), 5_000_000);
    }

    function testSettleFailedLeavesFundsInVault() public {
        _record(bytes32("c1"), 5_000_000);
        vm.prank(keeper);
        vault.settleFailed(bytes32("c1"));
        assertEq(usdc.balanceOf(staker), 0);
        assertEq(usdc.balanceOf(address(vault)), 5_000_000);
        assertEq(vault.totalPooled(), 0);
        assertEq(vault.totalSettledFailed(), 5_000_000);
    }

    function testDistributeToWinnerPaysOut() public {
        _record(bytes32("c1"), 6_000_000);
        vm.prank(keeper);
        vault.settleFailed(bytes32("c1"));

        address winner = address(0xD00D);
        vm.prank(owner);
        vault.distributeToWinner(bytes32("c1"), winner, 6_000_000);
        assertEq(usdc.balanceOf(winner), 6_000_000);
        assertEq(vault.totalDistributed(), 6_000_000);
    }

    function testOnlyKeeperCanRecord() public {
        _fundVault(1_000_000);
        vm.expectRevert(StakeWordVault.NotKeeper.selector);
        vault.recordDeposit(bytes32("c1"), staker, 1_000_000);
    }

    function testOnlyOwnerCanDistribute() public {
        _record(bytes32("c1"), 1_000_000);
        vm.prank(keeper);
        vault.settleFailed(bytes32("c1"));
        vm.expectRevert(StakeWordVault.NotOwner.selector);
        vault.distributeToWinner(bytes32("c1"), address(0xD00D), 1_000_000);
    }

    function testAdvanceSeason() public {
        assertEq(vault.currentSeasonId(), 1);
        vm.prank(owner);
        vault.advanceSeason();
        assertEq(vault.currentSeasonId(), 2);
    }
}
