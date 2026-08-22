// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/GasslessPilotVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DeployGasslessPilotVault
 * @notice Script de despliegue para GasslessPilotVault en Arbitrum Sepolia (testnet).
 *
 * Uso:
 *   forge script script/GasslessPilotVault.s.sol \
 *     --rpc-url $ARBITRUM_SEPOLIA_RPC_URL \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify
 *
 * Variables de entorno requeridas (definir en .env):
 *   PRIVATE_KEY              - clave privada del deployer
 *   ARBITRUM_SEPOLIA_RPC_URL - RPC de Arbitrum Sepolia
 *   ASSET_ADDRESS            - direccion del token subyacente (ej. USDC en Arbitrum Sepolia)
 *   TREASURY_ADDRESS         - direccion que recibe las comisiones de desempeno
 *   AAVE_POOL_ADDRESS        - direccion del Pool de Aave V3 en Arbitrum Sepolia
 *   ATOKEN_ADDRESS           - direccion del aToken correspondiente al asset (ej. aArbSepUSDC)
 */
contract DeployGasslessPilotVault is Script {
    function run() external returns (GasslessPilotVault vault) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address asset = vm.envAddress("ASSET_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address aavePool = vm.envAddress("AAVE_POOL_ADDRESS");
        address aToken = vm.envAddress("ATOKEN_ADDRESS");

        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Asset:", asset);
        console.log("Treasury:", treasury);
        console.log("Aave Pool:", aavePool);
        console.log("aToken:", aToken);

        vm.startBroadcast(deployerPrivateKey);

        vault = new GasslessPilotVault(
            IERC20(asset),
            treasury,
            aavePool,
            aToken
        );

        vm.stopBroadcast();

        console.log("GasslessPilotVault deployed at:", address(vault));
    }
}
