// client/src/services/wdkService.ts
import { ethers } from 'ethers'
import * as bip39 from "bip39"
import WalletManagerEvmErc4337, {
  type WalletAccountEvmErc4337,
} from '@tetherto/wdk-wallet-evm-erc-4337'

import {
  CHAIN_ID,
  RPC_URL,
  BUNDLER_URL,
  PAYMASTER_URL,
  PAYMASTER_ADDRESS,
  PAYMASTER_TOKEN_ADDRESS,
  USDC_ADDRESS,
  VAULT_ADDRESS,
} from '../config/constants'

const SAFE_MODULES_VERSION = '0.3.0' // única versión soportada en beta.15
const SEED_STORAGE_KEY = 'gasless_vault_demo_seed'

const ERC20_APPROVE_ABI = ['function approve(address spender, uint256 amount) returns (bool)']
const VAULT_DEPOSIT_ABI = ['function deposit(uint256 assets, address receiver) returns (uint256 shares)']

let walletManager: WalletManagerEvmErc4337 | null = null
let account: WalletAccountEvmErc4337 | null = null

// ---------------------------------------------------------------------------
// Seed management (⚠️ SOLO PARA DEMO/HACKATHON)
// ---------------------------------------------------------------------------

/**
 * ⚠️ SOLO PARA DEMO/HACKATHON.
 * Guarda la seed en localStorage sin cifrar. En producción esto debe
 * reemplazarse por almacenamiento seguro (Secure Enclave, passkeys,
 * MPC, o al menos cifrado con una contraseña del usuario).
 */
function getOrCreateSeedPhrase(): string {
  const existing = localStorage.getItem(SEED_STORAGE_KEY)
  if (existing) return existing

  const newSeed = ethers.Wallet.createRandom().mnemonic!.phrase
  

  if (typeof (bip39 as any).setDefaultWordlist === 'function') {
    ;(bip39 as any).setDefaultWordlist('english')
    
  } else {
    
  }

  
  localStorage.setItem(SEED_STORAGE_KEY, newSeed)
  return newSeed
}
/**
 * Punto de entrada del onboarding: genera/recupera la seed, inicializa
 * el wallet manager y devuelve la dirección de la smart account.
 * No requiere MetaMask ni ETH — así arranca la "wallet vacía".
 */
export async function connectGaslessWallet(index = 0): Promise<string> {
  const seed = getOrCreateSeedPhrase()
  initWallet(seed)
  return getSmartAccountAddress(index)
}

/**
 * Solo para demo: borra la seed guardada para simular un usuario nuevo
 * llegando por primera vez (útil para repetir el pitch en vivo).
 */
export function resetDemoWallet(): void {
  localStorage.removeItem(SEED_STORAGE_KEY)
  disposeWallet()
}

// ---------------------------------------------------------------------------
// Wallet manager / account
// ---------------------------------------------------------------------------

/**
 * Inicializa el wallet manager ERC-4337 en modo Paymaster Token
 * (gas pagado en USD₮ vía el paymaster de Candide).
 */
export function initWallet(seedPhrase: string): WalletManagerEvmErc4337 {
  
  walletManager = new WalletManagerEvmErc4337(seedPhrase, {
    chainId: CHAIN_ID,
    provider: RPC_URL,
    bundlerUrl: BUNDLER_URL,
    safeModulesVersion: SAFE_MODULES_VERSION,
    // Modo Paymaster Token — isSponsored y useNativeCoins quedan en false
    paymasterUrl: PAYMASTER_URL,
    paymasterAddress: PAYMASTER_ADDRESS,
    paymasterToken: { address: PAYMASTER_TOKEN_ADDRESS },
    // Tope de seguridad: aborta si el fee excede 1 USD₮ (6 decimales)
    transactionMaxFee: 1_000000,
  })
  return walletManager
}

/** Devuelve (y deriva de forma perezosa) la smart account en el índice dado. */
export async function getAccount(index = 0): Promise<WalletAccountEvmErc4337> {
  if (!walletManager) throw new Error('Wallet no inicializado. Llama a initWallet() primero.')
  if (!account) {
    account = await walletManager.getAccount(index)
  }
  return account
}

export async function getSmartAccountAddress(index = 0): Promise<string> {
  const acc = await getAccount(index)
  return acc.getAddress()
}

// ---------------------------------------------------------------------------
// Balances
// ---------------------------------------------------------------------------

/** Balance nativo (ETH) — informativo, no se usa para pagar gas en este flujo. */
export async function getNativeBalance(index = 0): Promise<bigint> {
  const acc = await getAccount(index)
  return acc.getBalance()
}

/** Balance de USD₮ disponible para pagar gas. */
export async function getPaymasterTokenBalance(index = 0): Promise<bigint> {
  const acc = await getAccount(index)
  return acc.getPaymasterTokenBalance()
}

/** Balance de un token ERC-20 arbitrario (ej. USDC del vault). */
export async function getTokenBalance(tokenAddress: string, index = 0): Promise<bigint> {
  const acc = await getAccount(index)
  return acc.getTokenBalance(tokenAddress)
}

// ---------------------------------------------------------------------------
// Llamadas genéricas al vault (una sola transacción)
// ---------------------------------------------------------------------------

/**
 * Estima el fee en USD₮ antes de enviar. Usa el MISMO tx/config que
 * pasarás a sendVaultCall — la caché del quote no incluye overrides
 * de modo de gas, así que deben coincidir.
 */
export async function quoteVaultCall(
  to: string,
  data: string,
  index = 0
): Promise<{ fee: bigint }> {
  const acc = await getAccount(index)
  return acc.quoteSendTransaction({ to, value: 0n, data })
}

/** Envía una llamada genérica al vault vía UserOperation, gas en USD₮. */
export async function sendVaultCall(
  to: string,
  data: string,
  index = 0
): Promise<{ hash: string; fee: bigint }> {
  const acc = await getAccount(index)
  return acc.sendTransaction({ to, value: 0n, data })
}

// ---------------------------------------------------------------------------
// Depósito gasless (approve + deposit batcheados)
// ---------------------------------------------------------------------------

/**
 * Deposita USDC en el vault en UNA sola UserOperation gasless
 * (approve + deposit empaquetados), pagando el gas en USD₮.
 */
export async function depositGasless(
  amountInUsdcUnits: bigint,
  index = 0
): Promise<{ hash: string; fee: bigint }> {
  const acc = await getAccount(index)
  const owner = await acc.getAddress()

  const erc20Iface = new ethers.Interface(ERC20_APPROVE_ABI)
  const approveData = erc20Iface.encodeFunctionData('approve', [VAULT_ADDRESS, amountInUsdcUnits])

  const vaultIface = new ethers.Interface(VAULT_DEPOSIT_ABI)
  const depositData = vaultIface.encodeFunctionData('deposit', [amountInUsdcUnits, owner])

  return acc.sendTransaction([
    { to: USDC_ADDRESS, value: 0n, data: approveData },
    { to: VAULT_ADDRESS, value: 0n, data: depositData },
  ])
}

/** Cotiza el fee en USD₮ del approve+deposit batcheado, antes de firmarlo. */
export async function quoteDepositGasless(
  amountInUsdcUnits: bigint,
  index = 0
): Promise<{ fee: bigint }> {
  const acc = await getAccount(index)
  const owner = await acc.getAddress()

  const erc20Iface = new ethers.Interface(ERC20_APPROVE_ABI)
  const approveData = erc20Iface.encodeFunctionData('approve', [VAULT_ADDRESS, amountInUsdcUnits])

  const vaultIface = new ethers.Interface(VAULT_DEPOSIT_ABI)
  const depositData = vaultIface.encodeFunctionData('deposit', [amountInUsdcUnits, owner])

  return acc.quoteSendTransaction([
    { to: USDC_ADDRESS, value: 0n, data: approveData },
    { to: VAULT_ADDRESS, value: 0n, data: depositData },
  ])
}

// ---------------------------------------------------------------------------
// Limpieza
// ---------------------------------------------------------------------------

/** Limpia las llaves privadas de memoria. Llamar al terminar la sesión. */
export function disposeWallet(): void {
  account?.dispose()
  walletManager = null
  account = null
}