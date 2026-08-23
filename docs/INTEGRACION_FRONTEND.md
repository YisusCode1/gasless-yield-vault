# Integración Frontend ↔ FlowFi & Tether WDK Gasless

Este documento describe la arquitectura y guía de integración para la **interfaz de usuario**, la **abstracción de cuentas sin gas (Tether WDK Pista 2)** y el consumo de métricas y señales del motor de IA.

---

## 1. Módulos y Arquitectura del Frontend

FlowFi soporta dos modalidades de interacción:
1. **Modo WDK Gasless (0 ETH)**: Utiliza `@tetherto/wdk-wallet-evm-erc-4337` junto con Pimlico Paymaster para permitir que usuarios con 0.00 ETH depositen directamente usando USD₮.
2. **Modo MetaMask Tradicional**: Conexión estándar mediante proveedor Web3 inyectado para usuarios con EOA.

---

## 2. Integración de Tether WDK Gasless ([`wdkGaslessService.ts`](../client/src/services/wdkGaslessService.ts))

### Inicialización de la Smart Account ERC-4337
```typescript
import { WalletManagerEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337';

const walletManager = new WalletManagerEvmErc4337(seedPhrase, {
  chainId: 421614, // Arbitrum Sepolia
  provider: 'https://sepolia-rollup.arbitrum.io/rpc',
  bundlerUrl: import.meta.env.VITE_PIMLICO_RPC_URL,
  paymasterUrl: import.meta.env.VITE_PIMLICO_RPC_URL,
  safeModulesVersion: '0.3.0',
  useNativeCoins: false // 100% Gasless: tarifas liquidadas en USD₮
});

const account = await walletManager.getAccount(0);
const smartAccountAddress = await account.getAddress();
```

### Cotización de Tarifa en USD₮
```typescript
// Estima la comisión de gas expresada en USD₮ antes de solicitar la firma
const quote = await account.quoteSendTransaction([approveTx, depositTx]);
console.log('Comisión estimada:', quote.fee);
```

### Depósito en Batch Atómico (1 sola UserOperation)
```typescript
// Agrupa approve + deposit para ejecutarse en una sola operación sin gas nativo
const userOp = await account.sendTransaction([
  {
    to: USDT_CONTRACT_ADDRESS,
    value: '0',
    data: erc20Interface.encodeFunctionData('approve', [VAULT_ADDRESS, amountWei])
  },
  {
    to: VAULT_ADDRESS,
    value: '0',
    data: vaultInterface.encodeFunctionData('deposit', [amountWei, smartAccountAddress])
  }
]);
```

---

## 3. Funciones ERC-4626 del Smart Contract

### Depósitos y Retiros
```solidity
function deposit(uint256 assets, address receiver) external returns (uint256 shares);
function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
```

### Lectura de Métricas y Conversión
```solidity
function totalAssets() external view returns (uint256);       // TVL total de la bóveda
function balanceOf(address user) external view returns (uint256); // Shares del usuario (fUSD)
function convertToAssets(uint256 shares) external view returns (uint256); // Shares -> Valor real en USD₮
function convertToShares(uint256 assets) external view returns (uint256); // Valor real -> Shares
```

---

## 4. Visualización de Decisiones de la IA y Eventos

El contrato emite estos eventos para el historial y timeline de actividad:

```solidity
event SignalExecuted(uint256 amountToSupply, uint256 amountToWithdraw, uint256 profitGenerated, uint256 nonce);
event FeeCollected(address indexed treasury, uint256 amount);
```

---

## 5. Endpoints de la API Backend de FlowFi

* `GET /api/v1/strategy?mode=moderado`: Devuelve la recomendación activa generada por Gemini (`HOLD`, `SUPPLY`, `WITHDRAW`), confianza y métricas de mercado.
* `GET /api/v1/historical-yield`: Historial cronológico de rendimiento y TVL.
* `POST /api/v1/rebalance`: Dispara el análisis y genera la firma criptográfica EIP-712.
* `GET /api/v1/flowfi`: Métricas globales del ecosistema FlowFi.
