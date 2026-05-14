// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/StakeWordVault.sol";

contract Deploy is Script {
    function run() external returns (StakeWordVault vault) {
        address usdc = vm.envAddress("USDC_ADDRESS"); // 0x3600... on Arc testnet
        address keeper = vm.envAddress("KEEPER_ADDRESS"); // platform evaluator wallet
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(pk);
        vault = new StakeWordVault(usdc, keeper);
        vm.stopBroadcast();

        console.log("StakeWordVault deployed at:", address(vault));
    }
}
