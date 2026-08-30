Gasless Yield Vault

🇪🇸 Español | 🇬🇧 English

Español

Onboarding sin gas para DeFi. El usuario llega con una wallet vacía —sin ETH, sin haber usado nunca una blockchain— y en dos pasos tiene fondos generando rendimiento en Aave V3. El gas de cada transacción se paga en USD₮, no en ETH.

Construido para WDK Pista 2 — Onboarding sin gas (gasless), sobre Ethereum Sepolia, usando @tetherto/wdk-wallet-evm-erc-4337 con el paymaster de Candide.

El problema que resuelve

La mayor barrera de entrada a DeFi no es entender qué es un vault o un yield farming — es conseguir ETH antes de poder hacer absolutamente nada. Un usuario nuevo necesita comprar ETH en un exchange, retirarlo a su wallet, y recién ahí puede pagar el gas de su primera transacción. Este proyecto elimina ese paso: la wallet del usuario nunca necesita ETH, porque el gas se paga automáticamente en el mismo stablecoin que está depositando.

Cómo funciona
┌──────────────────────┐
│ 1. Usuario llega      │   Sin wallet previa, sin ETH, sin extensión de
│    sin ETH             │   navegador instalada.
└──────────┬────────────┘
           │
           ▼
┌──────────────────────┐
│ 2. Se deriva una       │   WalletManagerEvmErc4337 genera una seed BIP-39
│    Smart Account        │   y deriva una cuenta ERC-4337 (Safe Modules 0.3.0).
│    ERC-4337             │   La dirección existe on-chain sin haber pagado
└──────────┬────────────┘   ni un solo gas.
           │
           ▼
┌──────────────────────┐
│ 3. El usuario deposita │   approve() + deposit() del vault se empaquetan
│    USDC en el vault     │   en UNA sola UserOperation. El fee se cotiza en
│    (approve + deposit   │   USD₮ ANTES de firmar, para que el usuario sepa
│    en 1 sola tx)        │   exactamente cuánto va a costar.
└──────────┬────────────┘
           │
           ▼
┌──────────────────────┐
│ 4. El bundler/paymaster │  Candide arma la UserOperation, cobra el fee en
│    de Candide procesa   │  USD₮ del saldo del usuario, y la envía a la red.
│    la transacción        │  El usuario nunca ve un prompt de MetaMask.
└──────────┬────────────┘
           │
           ▼
┌──────────────────────┐
│ 5. El vault (ERC-4626)  │  GasslessPilotVault.sol deposita automáticamente
│    despliega el capital  │  el capital en el pool de Aave V3, generando
│    en Aave V3             │  rendimiento sobre el activo depositado.
└──────────┬────────────┘
           │
           ▼
┌──────────────────────┐
│ 6. Retiro, mismo         │  withdraw() gasless, misma lógica: se cotiza el
│    flujo sin gas          │  fee en USD₮, se firma la UserOperation, Aave
│                            │  libera la liquidez necesaria.
└──────────────────────┘
Arquitectura
gasless-yield-vault/
├── client/                          Frontend — React + Vite + TypeScript
│   └── src/
│       ├── components/
│       │   └── VaultView.tsx        UI del vault: balances, depósito/retiro,
│       │                            cotización previa, link a la tx confirmada
│       ├── config/
│       │   └── constants.tsx        Direcciones desplegadas, RPC, endpoints
│       │                            de Candide (bundler + paymaster)
│       ├── hooks/
│       │   └── useVault.ts          Estado de la UI: connect, deposit, withdraw,
│       │                            refresh de balances, cotización de fees
│       └── services/
│           └── wdkService.ts        Capa que envuelve @tetherto/wdk-wallet-evm-erc-4337:
│                                     deriva la smart account, arma las
│                                     UserOperations, paga el gas en USD₮
│
├── contracts/                       Contratos — Foundry
│   └── src/
│       ├── GasslessPilotVault.sol   Vault ERC-4626 que despliega capital
│       │                            automáticamente en Aave V3
│       └── MockUSDT.sol             Token ERC-20 de prueba (6 decimales) para
│                                     fondear wallets de demo en testnet
│
├── server/                          Backend — Python / FastAPI
│   └── app/
│       └── main.py                  (endpoints de soporte al frontend, si aplica)
│
├── docs/                            Documentación técnica adicional
└── compose.yml                      Orquestación local con Docker
Por qué esta arquitectura y no otra

Durante el desarrollo se evaluaron dos integraciones gasless en paralelo (una sobre Ethereum Sepolia + paymaster de Candide, otra sobre Arbitrum Sepolia + Pimlico). Se optó por la primera porque:

El vault y el activo mock ya estaban desplegados y verificados en Ethereum Sepolia.
Se confirmó on-chain que el paymaster de Candide soporta USD₮ como gas token en esa red (pm_supportedERC20Tokens).
La integración con Pimlico dependía de una API key sin configurar y no tenía transacciones reales verificadas — solo un fallback que simulaba hashes.
Contratos desplegados (Ethereum Sepolia)
Contrato	Dirección
GasslessPilotVault (ERC-4626)	0x8C35A46BDD1Cb643166f88e945C0F8fDb621a15A
MockUSDT (activo del vault, 6 decimales)	0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
Aave V3 Pool	0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
aToken (posición en Aave)	0x16dA4541aD1807f4443d92D26044C1147406EB80
USD₮ de prueba (gas token, Candide)	0xd077A400968890Eacc75cdc901F0356c943e4fDb
EntryPoint (ERC-4337 v0.7)	0x0000000071727De22E5E9d8BAf0edAc6f37da032
Stack técnico
Smart account: @tetherto/wdk-wallet-evm-erc-4337 (Safe Modules 0.3.0)
Bundler / Paymaster: Candide (api.candide.dev)
Contratos: Solidity, Foundry, OpenZeppelin, integración con Aave V3
Frontend: React + Vite + TypeScript, ethers.js
Backend: Python / FastAPI
Cómo correrlo localmente
Contratos
bash
cd contracts
forge install
forge build
forge test

Variables necesarias en contracts/.env (no se sube al repo):

dotenv
PRIVATE_KEY=
ETHEREUM_SEPOLIA_RPC_URL=
ASSET_ADDRESS=
TREASURY_ADDRESS=
AAVE_POOL_ADDRESS=
ATOKEN_ADDRESS=
CANDIDE_API_KEY=
Frontend
bash
cd client
npm install
npm run dev

Variables necesarias en client/.env (con prefijo VITE_ para que Vite las exponga):

dotenv
VITE_CANDIDE_API_KEY=
Backend (opcional)
bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
Roadmap / pendientes
 Confirmar que las shares del vault (decimals()) coinciden con el activo subyacente en cualquier despliegue nuevo
 Migrar BUNDLER_URL/PAYMASTER_URL al endpoint autenticado de Candide para producción (mejor rate limit que el endpoint público)
 Integrar el layout completo (navegación, otras vistas) alrededor de VaultView
Equipo

Hackathon WDK — Pista 2 (Onboarding sin gas).

English

Gasless onboarding for DeFi. The user arrives with an empty wallet — no ETH, never having touched a blockchain before — and within two steps has funds earning yield on Aave V3. Gas for every transaction is paid in USD₮, not ETH.

Built for WDK Track 2 — Gasless Onboarding, on Ethereum Sepolia, using @tetherto/wdk-wallet-evm-erc-4337 with the Candide paymaster.

The problem it solves

The biggest barrier to entering DeFi isn't understanding what a vault or yield farming is — it's getting hold of ETH before you can do anything at all. A new user has to buy ETH on an exchange, withdraw it to their wallet, and only then can they pay gas for their first transaction. This project removes that step entirely: the user's wallet never needs ETH, because gas is automatically paid in the same stablecoin they're depositing.

How it works
┌──────────────────────┐
│ 1. User arrives        │   No prior wallet, no ETH, no browser extension
│    with no ETH          │   installed.
└──────────┬────────────┘
           │
           ▼
┌──────────────────────┐
│ 2. A Smart Account      │   WalletManagerEvmErc4337 generates a BIP-39 seed
│    (ERC-4337) is         │   and derives an ERC-4337 account (Safe Modules
│    derived               │   0.3.0). The address exists on-chain without
└──────────┬────────────┘   having paid any gas.
           │
           ▼
┌──────────────────────┐
│ 3. User deposits USDC   │   The vault's approve() + deposit() are bundled
│    into the vault        │   into a SINGLE UserOperation. The fee is quoted
│    (approve + deposit    │   in USD₮ BEFORE signing, so the user knows
│    in one tx)            │   exactly what it will cost.
└──────────┬────────────┘
           │
           ▼
┌──────────────────────┐
│ 4. Candide's bundler/    │  Candide builds the UserOperation, charges the
│    paymaster processes   │  fee in USD₮ from the user's balance, and
│    the transaction        │  submits it to the network. The user never sees
└──────────┬────────────┘   a MetaMask prompt.
           │
           ▼
┌──────────────────────┐
│ 5. The vault (ERC-4626)  │  GasslessPilotVault.sol automatically deploys
│    puts capital to work    │  the capital into the Aave V3 pool, earning
│    in Aave V3               │  yield on the deposited asset.
└──────────┬────────────┘
           │
           ▼
┌──────────────────────┐
│ 6. Withdrawal, same       │  Gasless withdraw(), same logic: fee quoted in
│    gasless flow            │  USD₮, UserOperation signed, Aave releases the
│                             │  needed liquidity.
└──────────────────────┘
Architecture
gasless-yield-vault/
├── client/                          Frontend — React + Vite + TypeScript
│   └── src/
│       ├── components/
│       │   └── VaultView.tsx        Vault UI: balances, deposit/withdraw,
│       │                            fee quote preview, link to confirmed tx
│       ├── config/
│       │   └── constants.tsx        Deployed addresses, RPC, Candide
│       │                            (bundler + paymaster) endpoints
│       ├── hooks/
│       │   └── useVault.ts          UI state: connect, deposit, withdraw,
│       │                            balance refresh, fee quoting
│       └── services/
│           └── wdkService.ts        Wrapper layer around
│                                     @tetherto/wdk-wallet-evm-erc-4337:
│                                     derives the smart account, builds
│                                     UserOperations, pays gas in USD₮
│
├── contracts/                       Contracts — Foundry
│   └── src/
│       ├── GasslessPilotVault.sol   ERC-4626 vault that auto-deploys
│       │                            capital into Aave V3
│       └── MockUSDT.sol             Test ERC-20 token (6 decimals) used to
│                                     fund demo wallets on testnet
│
├── server/                          Backend — Python / FastAPI
│   └── app/
│       └── main.py                  (frontend support endpoints, if any)
│
├── docs/                            Additional technical documentation
└── compose.yml                      Local orchestration with Docker
Why this architecture and not another

During development, two gasless integrations were evaluated in parallel (one on Ethereum Sepolia + the Candide paymaster, another on Arbitrum Sepolia + Pimlico). The first was chosen because:

The vault and mock asset were already deployed and verified on Ethereum Sepolia.
It was confirmed on-chain that Candide's paymaster supports USD₮ as a gas token on that network (pm_supportedERC20Tokens).
The Pimlico integration depended on an unconfigured API key and had no verified real transactions — only a fallback that simulated hashes.
Deployed contracts (Ethereum Sepolia)
Contract	Address
GasslessPilotVault (ERC-4626)	0x8C35A46BDD1Cb643166f88e945C0F8fDb621a15A
MockUSDT (vault asset, 6 decimals)	0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
Aave V3 Pool	0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
aToken (Aave position)	0x16dA4541aD1807f4443d92D26044C1147406EB80
Test USD₮ (gas token, Candide)	0xd077A400968890Eacc75cdc901F0356c943e4fDb
EntryPoint (ERC-4337 v0.7)	0x0000000071727De22E5E9d8BAf0edAc6f37da032
Tech stack
Smart account: @tetherto/wdk-wallet-evm-erc-4337 (Safe Modules 0.3.0)
Bundler / Paymaster: Candide (api.candide.dev)
Contracts: Solidity, Foundry, OpenZeppelin, Aave V3 integration
Frontend: React + Vite + TypeScript, ethers.js
Backend: Python / FastAPI
Running it locally
Contracts
bash
cd contracts
forge install
forge build
forge test

Required variables in contracts/.env (not committed to the repo):

dotenv
PRIVATE_KEY=
ETHEREUM_SEPOLIA_RPC_URL=
ASSET_ADDRESS=
TREASURY_ADDRESS=
AAVE_POOL_ADDRESS=
ATOKEN_ADDRESS=
CANDIDE_API_KEY=
Frontend
bash
cd client
npm install
npm run dev

Required variables in client/.env (with the VITE_ prefix so Vite exposes them):

dotenv
VITE_CANDIDE_API_KEY=
Backend (optional)
bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
Roadmap / TODO
 Confirm the vault's share decimals() match the underlying asset on any new deployment
 Migrate BUNDLER_URL/PAYMASTER_URL to Candide's authenticated endpoint for production (better rate limits than the public endpoint)
 Integrate the full layout (navigation, other views) around VaultView
Team

WDK Hackathon — Track 2 (Gasless Onboarding).