// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @notice Token ERC-20 de prueba que simula USD₮ (Tether) para testnets donde
 *         el USD₮ real no existe (ej. Arbitrum Sepolia). Usado exclusivamente
 *         como paymasterToken en la integracion WDK gasless para el hackathon
 *         de Aleph, siguiendo las reglas oficiales que exigen desplegar un
 *         mock propio en vez de sustituir por el token de prueba de otro
 *         proveedor (ej. Candide Test Token).
 *
 *         NO USAR EN PRODUCCION. Este contrato permite mint() sin restricciones
 *         para poder fondear wallets de demo rapidamente durante el evento.
 */
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock Tether USD", "USDT") {}

    /// @notice Usa 6 decimales, igual que el USDT real
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Acuña tokens de prueba a cualquier direccion. Sin restricciones
     *         a proposito, para agilizar el fondeo de wallets durante la demo.
     * @param to Direccion que recibe los tokens
     * @param amount Cantidad a acuñar (en unidades base, 6 decimales)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Acuña 1000 USD$T de prueba al remitente. Atajo para fondearse
     *         a uno mismo sin tener que calcular decimales.
     */
    function faucet() external {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}
