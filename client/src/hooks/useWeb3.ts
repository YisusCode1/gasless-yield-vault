import { useContext } from 'react';
import { Web3Context, Web3ContextType } from '../context/Web3Context';

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 debe ser utilizado dentro de un Web3Provider');
  }
  return context;
};
