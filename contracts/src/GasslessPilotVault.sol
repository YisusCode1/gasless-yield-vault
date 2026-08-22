// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Interfaz minima del Pool de Aave V3 (solo lo que necesitamos)
interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/**
 * @title GasslessPilotVault
 * @notice Boveda ERC-4626 en Arbitrum que invierte en Aave V3.
 *         Version adaptada para el hackathon de Aleph (Pista WDK - sin gas):
 *         se elimino la dependencia del agente de IA remoto (Gemini) y la
 *         verificacion EIP-712 de senales off-chain, ya que el proyecto no
 *         depende de un servicio en la nube. La estrategia de despliegue de
 *         capital hacia Aave es controlada por el owner (o automatizada por
 *         un keeper simple), dejando espacio para que el flujo de deposito
 *         se ejecute via una UserOperation patrocinada (WDK gasless), sin
 *         que el usuario final necesite gas nativo.
 */
contract GasslessPilotVault is ERC4626, Ownable, ReentrancyGuard {

    // --- Direcciones clave ---
    address public treasury;              // Recibe las comisiones de desempeno
    IAavePool public immutable aavePool;  // Pool de Aave V3 en Arbitrum
    address public immutable aToken;      // aToken que representa nuestro deposito en Aave (ej. aArbUSDC)

    // --- Estrategia ---
    // Porcentaje (base 10000) del capital liquido que se despliega automaticamente
    // hacia Aave en cada deposito. 10000 = 100% se deposita en Aave.
    uint256 public targetAllocationBps = 10000;
    uint256 public constant MAX_BPS = 10000;

    // --- Comisiones ---
    uint256 public performanceFee = 1000; // 10% (base 10000)
    uint256 public lastRecordedProfit;

    event StrategyExecuted(uint256 amountToSupply, uint256 amountToWithdraw);
    event FeeCollected(address indexed treasury, uint256 amount);
    event TreasuryUpdated(address indexed newTreasury);
    event TargetAllocationUpdated(uint256 newAllocationBps);

    constructor(
        IERC20 _asset,
        address _treasury,
        address _aavePool,
        address _aToken
    )
        ERC20("GasslessPilot Vault Share", "ypVault")
        ERC4626(_asset)
        Ownable(msg.sender)
    {
        require(_treasury != address(0), "Tesoreria invalida");
        require(_aavePool != address(0), "Pool Aave invalido");
        require(_aToken != address(0), "aToken invalido");

        treasury = _treasury;
        aavePool = IAavePool(_aavePool);
        aToken = _aToken;

        // Aprobacion maxima para que el Pool de Aave pueda tomar el activo cuando hagamos supply()
        IERC20(address(_asset)).approve(_aavePool, type(uint256).max);
    }

    /**
     * @notice Hook interno de ERC-4626 que se ejecuta despues de recibir el deposito.
     * @dev Reemplaza a executeSignal(): en vez de esperar una firma EIP-712 del
     *      agente de IA, el propio deposito dispara el despliegue de capital
     *      hacia Aave segun targetAllocationBps. Esto simplifica el flujo para
     *      que sea compatible con una sola UserOperation gasless (approve + deposit).
     */
    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal override nonReentrant {
        super._deposit(caller, receiver, assets, shares);
        _deployToStrategy();
    }

    /**
     * @notice Despliega hacia Aave la porcion del capital liquido definida por
     *         targetAllocationBps. Puede llamarla cualquiera (deposit la dispara
     *         automaticamente), pero tambien queda expuesta para un keeper simple.
     */
    function _deployToStrategy() internal {
        uint256 liquid = IERC20(asset()).balanceOf(address(this));
        if (liquid == 0) return;

        uint256 amountToSupply = (liquid * targetAllocationBps) / MAX_BPS;
        if (amountToSupply > 0) {
            aavePool.supply(asset(), amountToSupply, address(this), 0);
            emit StrategyExecuted(amountToSupply, 0);
        }
    }

    /**
     * @notice Cobra la comision de desempeno sobre las ganancias acumuladas en Aave
     *         desde el ultimo cobro. Reemplaza el profitGenerated que antes llegaba
     *         firmado por el agente: ahora se calcula on-chain comparando totalAssets().
     */
    function collectPerformanceFee() external onlyOwner {
        uint256 currentAssets = totalAssets();
        uint256 principal = totalSupply() == 0 ? 0 : convertToAssets(totalSupply());

        if (currentAssets > lastRecordedProfit && principal > 0) {
            uint256 profit = currentAssets - lastRecordedProfit;
            uint256 feeAmount = (profit * performanceFee) / MAX_BPS;

            if (feeAmount > 0) {
                _mint(treasury, convertToShares(feeAmount));
                emit FeeCollected(treasury, feeAmount);
            }
        }
        lastRecordedProfit = currentAssets;
    }

    // --- Configuracion Admin ---

    function setPerformanceFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 2000, "Comision supera el maximo");
        performanceFee = _newFee;
    }

    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Direccion invalida");
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    function setTargetAllocation(uint256 _newAllocationBps) external onlyOwner {
        require(_newAllocationBps <= MAX_BPS, "Asignacion invalida");
        targetAllocationBps = _newAllocationBps;
        emit TargetAllocationUpdated(_newAllocationBps);
    }

    /// @notice Permite al owner forzar un rebalanceo manual (deposito o retiro parcial de Aave)
    function rebalance(uint256 amountToSupply, uint256 amountToWithdraw) external onlyOwner nonReentrant {
        if (amountToSupply > 0) {
            aavePool.supply(asset(), amountToSupply, address(this), 0);
        }
        if (amountToWithdraw > 0) {
            aavePool.withdraw(asset(), amountToWithdraw, address(this));
        }
        emit StrategyExecuted(amountToSupply, amountToWithdraw);
    }

    /**
     * @notice Total de activos gestionados: lo que esta liquido en el vault
     *         mas lo que esta depositado (y generando yield) en Aave.
     */
    function totalAssets() public view override returns (uint256) {
        uint256 liquid = IERC20(asset()).balanceOf(address(this));
        uint256 deployed = IERC20(aToken).balanceOf(address(this));
        return liquid + deployed;
    }

    /**
     * @dev Hook interno que ejecutan withdraw() y redeem() de ERC-4626 antes
     *      de transferir el activo al usuario. Como nuestros fondos pueden
     *      estar depositados en Aave (no liquidos), sacamos automaticamente
     *      la diferencia que falte desde Aave ANTES de que se ejecute la
     *      transferencia real.
     */
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal override nonReentrant {
        uint256 liquid = IERC20(asset()).balanceOf(address(this));

        if (liquid < assets) {
            uint256 shortfall = assets - liquid;
            aavePool.withdraw(asset(), shortfall, address(this));
        }

        super._withdraw(caller, receiver, owner, assets, shares);
    }
}
