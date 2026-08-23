import { ethers } from "ethers";
import { VAULT_ADDRESS, CHAIN_ID, CHAIN_NAME, RPC_URL, BLOCK_EXPLORER } from "../config/constants";
import vaultAbi from "../config/GasslessPilotVault.abi.json";

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;

/** Conecta con la wallet del navegador (MetaMask, etc.) y valida la red */
export async function connectWallet(): Promise<string> {
  if (!(window as any).ethereum) {
    throw new Error("No se detecto una wallet (instala MetaMask)");
  }

  provider = new ethers.BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    await switchToNetwork();
  }

  return await signer.getAddress();
}

/** Pide a la wallet cambiar a la red configurada; la agrega si no la tiene */
async function switchToNetwork() {
  const chainIdHex = "0x" + CHAIN_ID.toString(16);
  try {
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (err: any) {
    if (err.code === 4902) {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: chainIdHex,
          chainName: CHAIN_NAME,
          rpcUrls: [RPC_URL],
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          blockExplorerUrls: [BLOCK_EXPLORER],
        }],
      });
    } else {
      throw err;
    }
  }
}

export function getVaultContract(): ethers.Contract {
  if (!signer) throw new Error("Wallet no conectada");
  return new ethers.Contract(VAULT_ADDRESS, vaultAbi, signer);
}

export function getVaultContractReadOnly(): ethers.Contract {
  const readProvider = provider ?? new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(VAULT_ADDRESS, vaultAbi, readProvider);
}

export function getErc20Contract(tokenAddress: string): ethers.Contract {
  const erc20Abi = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];
  if (!signer) throw new Error("Wallet no conectada");
  return new ethers.Contract(tokenAddress, erc20Abi, signer);
}

export function getSigner() {
  return signer;
}