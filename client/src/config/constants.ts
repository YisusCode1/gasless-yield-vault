const CANDIDE_API_KEY = import.meta.env.VITE_CANDIDE_API_KEY as string;

export const CHAIN_ID = 11155111;
export const CHAIN_NAME = "Ethereum Sepolia";
export const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
export const BLOCK_EXPLORER = "https://sepolia.etherscan.io";

export const VAULT_ADDRESS = "0x8C35A46BDD1Cb643166f88e945C0F8fDb621a15A";

export const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
export const USDC_DECIMALS = 6;
export const A_USDC_ADDRESS = "0x16dA4541aD1807f4443d92D26044C1147406EB80";

export const AAVE_POOL_ADDRESS = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";

export const PAYMASTER_TOKEN_ADDRESS = "0xd077A400968890Eacc75cdc901F0356c943e4fDb"; // USD₮ real (Sepolia, Candide)
export const BUNDLER_URL = `https://api.candide.dev/api/v3/${CHAIN_ID}/${CANDIDE_API_KEY}`;
export const PAYMASTER_URL =  BUNDLER_URL; // mismo endpoint unificado
export const PAYMASTER_ADDRESS = "0x8b1f6cb5d062aa2ce8d581942bbb960420d875ba";
export const ENTRY_POINT_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
