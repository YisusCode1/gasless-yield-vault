# Integración IA ↔ Smart Contract — FlowFi

Este documento describe la especificación técnica para el **Motor de Inteligencia Artificial (Gemini)** y el **Middleware Criptográfico (EIP-712)** que conecta las decisiones del modelo con el contrato `FlowFiVault.sol`.

---

## 1. Responsabilidades del Backend de IA

1. **Lectura On-Chain de Mercado:** Monitorear tasas en Aave V3 (`supplyRate`, `utilizationRate`) y costo de gas en Arbitrum Sepolia.
2. **Razonamiento Contextual (Gemini LLM):** Evaluar el perfil de riesgo seleccionado (`conservador`, `moderado`, `agresivo`) y determinar la asignación óptima de capital.
3. **Firma Criptográfica Off-Chain (EIP-712):** Firmar la orden con la clave privada autorizada del agente.
4. **Ejecución y Auditoría On-Chain:** Despachar la señal firmada hacia `executeSignal(...)` en `FlowFiVault.sol`.

---

## 2. Lectura On-Chain del Rendimiento de Aave V3

```python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider(ARBITRUM_RPC_URL))
pool = w3.eth.contract(address=AAVE_POOL_ADDRESS, abi=AAVE_POOL_ABI)

reserve_data = pool.functions.getReserveData(ASSET_ADDRESS).call()
liquidity_rate = reserve_data[2]  # currentLiquidityRate en formato RAY (1e27)
apy_decimal = (liquidity_rate / 1e27) * 100
```

---

## 3. Función On-Chain de Ejecución (`FlowFiVault.sol`)

```solidity
function executeSignal(
    uint256 amountToSupply,     // Monto a suministrar en Aave V3
    uint256 amountToWithdraw,   // Monto a retirar de Aave V3
    uint256 profitGenerated,    // Rendimiento acumulado desde el último rebalanceo
    uint256 nonce,              // Anti-replay nonce único
    uint256 deadline,           // Timestamp límite de validez
    bytes calldata signature    // Firma EIP-712 del agente
) external
```

---

## 4. Estructura de Firma Criptográfica EIP-712 en Python

```python
from eth_account import Account
from eth_account.messages import encode_typed_data

domain_data = {
    "name": "FlowFiVault",
    "version": "1",
    "chainId": 421614,
    "verifyingContract": VAULT_CONTRACT_ADDRESS
}

message_types = {
    "RebalanceSignal": [
        {"name": "amountToSupply", "type": "uint256"},
        {"name": "amountToWithdraw", "type": "uint256"},
        {"name": "profitGenerated", "type": "uint256"},
        {"name": "nonce", "type": "uint256"},
        {"name": "deadline", "type": "uint256"}
    ]
}

message_data = {
    "amountToSupply": int(amount_to_supply),
    "amountToWithdraw": int(amount_to_withdraw),
    "profitGenerated": int(profit_generated),
    "nonce": int(nonce),
    "deadline": int(deadline)
}

encoded_msg = encode_typed_data(
    domain_data=domain_data,
    message_types={"RebalanceSignal": message_types["RebalanceSignal"]},
    message_data=message_data
)

signed_message = Account.sign_message(encoded_msg, private_key=AI_AGENT_PRIVATE_KEY)
signature_hex = signed_message.signature.hex()
```

---

## 5. Garantía de Seguridad On-Chain

El contrato `FlowFiVault.sol` implementa el estándar OpenZeppelin `ECDSA` y `EIP712`. Si la firma no coincide matemáticamente con la dirección del `aiAgent` configurada en el contrato, la transacción revierte con `InvalidSignature()`, impidiendo cualquier manipulación de fondos.
