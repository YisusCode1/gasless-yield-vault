import { useState, useCallback } from "react";
import { ethers } from "ethers";
import {
  connectWallet,
  getVaultContract,
  getVaultContractReadOnly,
  getErc20Contract,
  getSigner,
} from "../services/web3Service";
import { USDC_ADDRESS, USDC_DECIMALS, VAULT_ADDRESS } from "../config/constants";

interface VaultState {
  address: string | null;
  usdcBalance: string;
  vaultShares: string;
  totalAssets: string;
  loading: boolean;
  error: string | null;
}

export function useVault() {
  const [state, setState] = useState<VaultState>({
    address: null,
    usdcBalance: "0",
    vaultShares: "0",
    totalAssets: "0",
    loading: false,
    error: null,
  });

  /** Conecta la wallet y carga los datos iniciales */
  const connect = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const address = await connectWallet();
      await refresh(address);
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, []);

  /** Refresca balances de USDC, shares del vault, y totalAssets */
  const refresh = useCallback(async (address?: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const signer = getSigner();
      const userAddress = address ?? (signer ? await signer.getAddress() : null);
      if (!userAddress) throw new Error("Wallet no conectada");

      const vault = getVaultContractReadOnly();
      const usdc = getErc20Contract(USDC_ADDRESS);

      const [usdcBal, shares, total] = await Promise.all([
        usdc.balanceOf(userAddress),
        vault.balanceOf(userAddress),
        vault.totalAssets(),
      ]);

      setState({
        address: userAddress,
        usdcBalance: ethers.formatUnits(usdcBal, USDC_DECIMALS),
        vaultShares: ethers.formatUnits(shares, USDC_DECIMALS),
        totalAssets: ethers.formatUnits(total, USDC_DECIMALS),
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, []);

  /** Aprueba el vault para mover USDC del usuario (paso previo al deposito) */
  const approve = useCallback(async (amount: string) => {
    const usdc = getErc20Contract(USDC_ADDRESS);
    const amountWei = ethers.parseUnits(amount, USDC_DECIMALS);
    const tx = await usdc.approve(VAULT_ADDRESS, amountWei);
    await tx.wait();
  }, []);

  /** Deposita USDC en el vault (dispara el despliegue automatico a Aave) */
  const deposit = useCallback(async (amount: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const signer = getSigner();
      if (!signer) throw new Error("Wallet no conectada");
      const address = await signer.getAddress();

      await approve(amount);

      const vault = getVaultContract();
      const amountWei = ethers.parseUnits(amount, USDC_DECIMALS);
      const tx = await vault.deposit(amountWei, address);
      await tx.wait();

      await refresh(address);
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      throw err;
    }
  }, [approve, refresh]);

  /** Retira assets del vault (jala liquidez de Aave si hace falta) */
  const withdraw = useCallback(async (amount: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const signer = getSigner();
      if (!signer) throw new Error("Wallet no conectada");
      const address = await signer.getAddress();

      const vault = getVaultContract();
      const amountWei = ethers.parseUnits(amount, USDC_DECIMALS);
      const tx = await vault.withdraw(amountWei, address, address);
      await tx.wait();

      await refresh(address);
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      throw err;
    }
  }, [refresh]);

  return { ...state, connect, refresh, deposit, withdraw };
}
