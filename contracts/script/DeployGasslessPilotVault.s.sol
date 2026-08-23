// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GasslessPilotVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Script de deploy para GasslessPilotVault (FlowFi Protocol).
 * @dev Todas las direcciones se leen de variables de entorno.
 *
 * Uso:
 *   forge script script/DeployGasslessPilotVault.s.sol:DeployGasslessPilotVault \
 *     --rpc-url $RPC_URL_ARBITRUM_SEPOLIA \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify \
 *     --etherscan-api-key $ARBISCAN_API_KEY
 */
contract DeployGasslessPilotVault is Script {
    function run() external returns (GasslessPilotVault vault) {
        address assetAddress = vm.envAddress("ASSET_ADDRESS");
        address treasuryAddress = vm.envAddress("TREASURY_ADDRESS");
        address aavePoolAddress = vm.envAddress("AAVE_POOL_ADDRESS");
        address aTokenAddress = vm.envAddress("ATOKEN_ADDRESS");

        console.log("Desplegando FlowFi GasslessPilotVault con:");
        console.log("  asset:      ", assetAddress);
        console.log("  treasury:   ", treasuryAddress);
        console.log("  aavePool:   ", aavePoolAddress);
        console.log("  aToken:     ", aTokenAddress);

        vm.startBroadcast();

        vault = new GasslessPilotVault(
            IERC20(assetAddress),
            treasuryAddress,
            aavePoolAddress,
            aTokenAddress
        );

        vm.stopBroadcast();

        console.log("FlowFi GasslessPilotVault desplegado en:", address(vault));
    }
}
