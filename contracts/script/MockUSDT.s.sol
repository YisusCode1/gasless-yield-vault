// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/MockUSDT.sol";

/**
 * @title DeployMockUSDT
 * @notice Despliega el token mock USD₮ en Arbitrum Sepolia, usado como
 *         paymasterToken en la integracion WDK gasless del hackathon.
 *
 * Uso:
 *   forge script script/MockUSDT.s.sol \
 *     --rpc-url $ARBITRUM_SEPOLIA_RPC_URL \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast
 *
 * Variable de entorno requerida:
 *   PRIVATE_KEY - clave privada del deployer (misma que se usa para el vault)
 */
contract DeployMockUSDT is Script {
    function run() external returns (MockUSDT token) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("Deployer:", vm.addr(deployerPrivateKey));

        vm.startBroadcast(deployerPrivateKey);

        token = new MockUSDT();

        // Fondea al deployer con 1000 USDT de prueba de una vez
        token.faucet();

        vm.stopBroadcast();

        console.log("MockUSDT deployed at:", address(token));
        console.log("Deployer USDT balance:", token.balanceOf(vm.addr(deployerPrivateKey)));
    }
}
