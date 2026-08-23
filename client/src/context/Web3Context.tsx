import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WalletState } from '../types';
import { Web3Service } from '../services/web3Service';
import { ARBITRUM_SEPOLIA_CHAIN_ID } from '../config/constants';

export interface Web3ContextType {
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
}

export const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>({
    account: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    isDemo: false,
    error: null,
    balance: '0'
  });

  const connectWallet = useCallback(async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const { account, chainId, balance } = await Web3Service.connectWallet();
      setWallet({
        account,
        chainId,
        isConnected: true,
        isConnecting: false,
        isDemo: false,
        error: null,
        balance
      });
      localStorage.setItem('flowfi_wallet_connected', 'true');
    } catch (err: any) {
      setWallet({
        account: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        isDemo: false,
        error: err?.message || 'Error al conectar la wallet MetaMask.',
        balance: '0'
      });
      localStorage.removeItem('flowfi_wallet_connected');
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet({
      account: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      isDemo: false,
      error: null,
      balance: '0'
    });
    localStorage.removeItem('flowfi_wallet_connected');
  }, []);

  const switchNetwork = useCallback(async () => {
    try {
      await Web3Service.switchToArbitrumSepolia();
      if (wallet.account) {
        await connectWallet();
      }
    } catch {
      setWallet((prev) => ({
        ...prev,
        error: 'No se pudo cambiar a la red Arbitrum Sepolia.'
      }));
    }
  }, [wallet.account, connectWallet]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWallet((prev) => ({ ...prev, account: accounts[0], isConnected: true, isDemo: false }));
        }
      };

      const handleChainChanged = (hexChainId: string) => {
        const newChainId = parseInt(hexChainId, 16);
        setWallet((prev) => ({ ...prev, chainId: newChainId }));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      if (localStorage.getItem('flowfi_wallet_connected') === 'true') {
        connectWallet();
      }

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [connectWallet, disconnectWallet]);

  return (
    <Web3Context.Provider value={{ wallet, connectWallet, disconnectWallet, switchNetwork }}>
      {children}
    </Web3Context.Provider>
  );
};
