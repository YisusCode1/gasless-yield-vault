# Documentación Técnica: Tether WDK — Pista 1 (CLI/MCP) vs Pista 2 (Gasless)

> **Evaluación técnica de arquitectura, integración y especificación de FlowFi para el Hackathon 2026.**

---

## 1. Contexto del Sistema Base (FlowFi)

FlowFi combina la infraestructura on-chain verificada con la capa de abstracción de cuentas de Tether:

* **Smart Contract:** `GasslessPilotVault.sol` (ERC-4626) desplegado en **Arbitrum Sepolia** (`0x9b24ADD6fe458f1d620A17ceC8d20944C37296d7`), con despliegue automático a Aave V3 en cada depósito y rebalanceo manual por owner.
* **Seguridad Criptográfica:** Función `executeSignal()` protegida con verificación off-chain **EIP-712** y anti-replay vía `nonce`.
* **Cerebro de IA:** Gemini LLM con análisis de riesgo cuantitativo y emisión de señales estructuradas.
* **Capa de Abstracción Gasless (WDK Pista 2):** Servicio [`wdkGaslessService.ts`](../client/src/services/wdkGaslessService.ts) utilizando `@tetherto/wdk-wallet-evm-erc-4337` y Pimlico Paymaster.
* **Frontend:** Dashboard interactivo en React 18 + Vite + TypeScript con soporte para depósitos con 0 ETH nativo.

---

## 2. Decisión de Arquitectura: FlowFi en la Pista 2 (Tether WDK Gasless)

### 2.1. Propuesta de Valor: "Zero-to-First-Deposit Onboarding"
Un usuario nuevo sin experiencia en Web3 llega a FlowFi con una billetera vacía (**0.00 ETH**). A través del módulo oficial de WDK:
1. Se inicializa una **Smart Account ERC-4337**.
2. El usuario recibe USD₮ (o saldo de demo).
3. Puede depositar directamente en el Vault de rendimiento: **el gas se paga en USD₮ o es patrocinado por Paymaster**, sin requerir nunca la compra de ETH.

### 2.2. Diagrama de Arquitectura de FlowFi (Pista 2)

```mermaid
flowchart TD
    subgraph 1. Experiencia de Usuario (FlowFi Frontend)
        A[Usuario: 0.00 ETH | Saldo USDt] --> B[WDK Gasless Service: @tetherto/wdk-wallet-evm-erc-4337]
        B --> C[Cotizador: Estimar Tarifa en USDt]
        C --> D[Empaquetar UserOp: Approve USDt + Deposit FlowFiVault]
    end

    subgraph 2. Infraestructura Tether WDK Gasless (Pista 2)
        D --> E[Pimlico Bundler RPC en Arbitrum Sepolia 421614]
        E --> F[Paymaster Contract: Liquidación de Gas en USDt / Patrocinio]
        F --> G[EntryPoint 0.7 Contract]
    end

    subgraph 3. Smart Contracts On-Chain
        G --> H[FlowFiVault.sol ERC-4626]
        H --> I[Aave V3 Pool: Supply / Withdraw]
    end

    subgraph 4. Motor de Optimización IA (Backend)
        J[Datos Aave V3] --> K[Gemini LLM: Análisis de Rendimiento]
        K --> L[Signer EIP-712: Firma Criptográfica]
        L --> H
    end
```

---

## 3. Comparativa Técnica de Pistas

| Criterio | Pista 1: WDK CLI & MCP Server | Pista 2: WDK Gasless (Elegida por FlowFi) |
|---|---|---|
| **Paquetes WDK** | `@tetherto/wdk-cli`, `wdk-mcp` | `@tetherto/wdk`, `@tetherto/wdk-wallet-evm-erc-4337` |
| **Enfoque Principal** | Billetera agéntica para IA con spending caps | Onboarding sin fricción de gas para usuarios finales |
| **Experiencia de Usuario** | El agente opera tras bambalinas | El usuario deposita con 0 ETH nativo en 1 clic |
| **Infraestructura** | Servidor MCP local / stdio | Pimlico Bundler & Paymaster (Arbitrum Sepolia) |
| **Impacto Visual en Demo** | Logs de terminal de MCP y transacciones agénticas | Usuario con 0 ETH fondea y deposita sin comprar gas |
| **Alineación con Tether** | Uso de CLI en agentes autónomos | Adopción masiva de USD₮ como token de gas universal |

---

## 4. Implementación y Permalinks de Código

* **Servicio Gasless:** [`client/src/services/wdkGaslessService.ts`](../client/src/services/wdkGaslessService.ts)
* **Vista de Vault con Onboarding 0 ETH:** [`client/src/components/VaultView.tsx`](../client/src/components/VaultView.tsx)
* **Configuración de Variables de Entorno:** [`client/.env.example`](../client/.env.example)
* **Backend de Optimización IA:** [`server/app/main.py`](../server/app/main.py)
