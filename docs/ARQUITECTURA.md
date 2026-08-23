# Arquitectura del Sistema — FlowFi

Diagrama y especificación técnica de la interacción entre los componentes de FlowFi: **Onboarding Gasless con Tether WDK**, **Motor de Inteligencia Artificial (Gemini)** y **Smart Contracts ERC-4626 en Arbitrum Sepolia**.

📐 Ver Diagrama de Arquitectura en Figma: https://bit.ly/4cxNcvN 

---

## 🏗️ Flujo de Operación Integral

```mermaid
flowchart TD
    subgraph 1. Experiencia de Usuario & Onboarding (FlowFi Frontend)
        A[Usuario: 0.00 ETH | Saldo USDt] --> B[WDK Gasless Service: @tetherto/wdk-wallet-evm-erc-4337]
        B --> C[Cotizador: Estimar Tarifa en USDt]
        C --> D[Empaquetar UserOp Atómica: Approve USDt + Deposit FlowFiVault]
    end

    subgraph 2. Infraestructura Tether WDK Gasless (Pista 2)
        D --> E[Pimlico Bundler RPC en Arbitrum Sepolia 421614]
        E --> F[Paymaster Contract: Liquidación de Gas en USDt / Patrocinio]
        F --> G[EntryPoint 0.7 Contract]
    end

    subgraph 3. Smart Contracts On-Chain
        G --> H[FlowFiVault.sol ERC-4626]
        H --> I[Aave V3 Pool Arbitrum: Supply / Withdraw]
    end

    subgraph 4. Motor de Optimización IA (Backend)
        J[Datos Aave V3 + Gas Arbitrum] --> K[Gemini LLM: Análisis de Riesgo y Asignación]
        K --> L[Signer EIP-712: Firma Criptográfica Off-Chain]
        L --> H
    end
```

---

## 📌 Descripción de los Componentes

1. **Onboarding Sin Gas (Tether WDK Pista 2):**
   - El usuario no necesita comprar ni transferir ETH nativo.
   - FlowFi genera o carga una Smart Account ERC-4337 no custodial (`@tetherto/wdk-wallet-evm-erc-4337`).
   - Las operaciones de aprobación (`approve`) y depósito (`deposit`) se empaquetan en una sola `UserOperation` procesada por el Bundler y Paymaster de Pimlico en Arbitrum Sepolia.

2. **Bóveda Tokenizada ERC-4626 (`FlowFiVault.sol`):**
   - Recibe depósitos en USD₮/USDC y emite acciones representativas del valor de la bóveda (`fUSD`).
   - Gestiona liquidez con recuperación Just-In-Time de Aave V3 ante retiros de usuarios.

3. **Motor de Inteligencia Artificial & Verificación EIP-712:**
   - Monitorea continuamente las tasas de interés (`supplyRate`), la utilización del mercado y el costo de gas en L2.
   - Modela recomendaciones a través de Gemini LLM según el perfil de riesgo del usuario (Conservador, Moderado, Agresivo).
   - Firma la orden de rebalanceo off-chain (`EIP-712 Typed Data`).
   - El contrato `FlowFiVault.sol` valida matemáticamente la firma en `executeSignal()` antes de mover cualquier fondo hacia Aave V3.
