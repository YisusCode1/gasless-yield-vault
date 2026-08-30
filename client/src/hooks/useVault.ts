// client/src/hooks/useVault.ts
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import {
  connectGaslessWallet,
  getSmartAccountAddress,
  getPaymasterTokenBalance,
  getTokenBalance,
  quoteDepositGasless,
  depositGasless,
  quoteVaultCall,
  sendVaultCall,
  resetDemoWallet,
} from "../services/wdkService";
import { USDC_ADDRESS, USDC_DECIMALS, VAULT_ADDRESS, RPC_URL, PAYMASTER_TOKEN_ADDRESS } from "../config/constants";

const VAULT_READ_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function totalAssets() view returns (uint256)",
]
const VAULT_WITHDRAW_ABI = [
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)",
]
const USDT_DECIMALS = 6 // USD₮ en Ethereum/Sepolia usa 6 decimales, igual que USDC

interface VaultState {
  address: string | null;
  usdcBalance: string;
  usdtBalance: string;
  vaultShares: string;
  totalAssets: string;
  loading: boolean;
  error: string | null;
  lastTxHash: string | null;
}

function readOnlyProvider() {
  return new ethers.JsonRpcProvider(RPC_URL)
}

export function useVault() {
  const [state, setState] = useState<VaultState>({
    address: null,
    usdcBalance: "0",
    usdtBalance: "0",
    vaultShares: "0",
    totalAssets: "0",
    loading: false,
    error: null,
    lastTxHash: null,
  });

  /** Refresca balances de USDC, USD₮ (gas), shares del vault y totalAssets.
   *  Usa merge funcional (...s) para NO pisar lastTxHash ni otros campos
   *  que no le corresponde tocar (ej. justo después de un deposit/withdraw).
   */
  const refresh = useCallback(async (address?: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const userAddress = address ?? (await getSmartAccountAddress());

      const provider = readOnlyProvider();
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_READ_ABI, provider);

      const [usdcBalRaw, usdtBalRaw, shares, total] = await Promise.all([
        getTokenBalance(USDC_ADDRESS),
        getPaymasterTokenBalance(),
        vault.balanceOf(userAddress),
        vault.totalAssets(),
      ]);

      setState((s) => ({
        ...s,
        address: userAddress,
        usdcBalance: ethers.formatUnits(usdcBalRaw, USDC_DECIMALS),
        usdtBalance: ethers.formatUnits(usdtBalRaw, USDT_DECIMALS),
        vaultShares: ethers.formatUnits(shares, USDC_DECIMALS),
        totalAssets: ethers.formatUnits(total, USDC_DECIMALS),
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, []);

  /** Conecta (deriva) la smart account gasless y carga los datos iniciales */
  const connect = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const address = await connectGaslessWallet();      
      await refresh(address);
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, [refresh]);

  /** Cotiza el fee en USD₮ del depósito ANTES de firmar (para mostrar al usuario) */
  const getDepositQuote = useCallback(async (amount: string): Promise<string> => {
    const amountWei = ethers.parseUnits(amount, USDC_DECIMALS);
    const { fee } = await quoteDepositGasless(amountWei);
    return ethers.formatUnits(fee, USDT_DECIMALS);
  }, []);

  /** Deposita USDC en el vault vía UserOperation gasless (approve + deposit en una sola tx) */
  const deposit = useCallback(async (amount: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const amountWei = ethers.parseUnits(amount, USDC_DECIMALS);
      const { hash } = await depositGasless(amountWei);

      setState((s) => ({ ...s, lastTxHash: hash }));
      await refresh();
    } catch (err: any) {
      console.error("DEPOSIT ERROR:", err);
      setState((s) => ({ ...s, loading: false, error: err.message }));
      throw err;
    }
  }, [refresh]);

  /** Cotiza el fee en USD₮ del retiro ANTES de firmar */
  const getWithdrawQuote = useCallback(async (amount: string): Promise<string> => {
    const address = await getSmartAccountAddress();
    const amountWei = ethers.parseUnits(amount, USDC_DECIMALS);
    const iface = new ethers.Interface(VAULT_WITHDRAW_ABI);
    const data = iface.encodeFunctionData("withdraw", [amountWei, address, address]);
    const { fee } = await quoteVaultCall(VAULT_ADDRESS, data);
    return ethers.formatUnits(fee, USDT_DECIMALS);
  }, []);

  /** Retira assets del vault vía UserOperation gasless (jala liquidez de Aave si hace falta) */
  const withdraw = useCallback(async (amount: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const address = await getSmartAccountAddress();
      const amountWei = ethers.parseUnits(amount, USDC_DECIMALS);
      const iface = new ethers.Interface(VAULT_WITHDRAW_ABI);
      const data = iface.encodeFunctionData("withdraw", [amountWei, address, address]);

      const { hash } = await sendVaultCall(VAULT_ADDRESS, data);

      setState((s) => ({ ...s, lastTxHash: hash }));
      await refresh();
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      throw err;
    }
  }, [refresh]);

  /** Solo demo: reinicia todo para simular un usuario nuevo llegando por primera vez */
  const reset = useCallback(() => {
    resetDemoWallet();
    setState({
      address: null,
      usdcBalance: "0",
      usdtBalance: "0",
      vaultShares: "0",
      totalAssets: "0",
      loading: false,
      error: null,
      lastTxHash: null,
    });
  }, []);

  return {
    ...state,
    connect,
    refresh,
    getDepositQuote,
    deposit,
    getWithdrawQuote,
    withdraw,
    reset,
  };
}