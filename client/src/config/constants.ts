export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
export const ARBITRUM_SEPOLIA_HEX_CHAIN_ID = '0x66eee';
export const ARBITRUM_SEPOLIA_RPC = 'https://sepolia-rollup.arbitrum.io/rpc';
export const ARBITRUM_SEPOLIA_EXPLORER = 'https://sepolia.arbiscan.io';

// GasslessPilotVault desplegado en Arbitrum Sepolia por Jesús
// Tx: 0x61aebe7b3a22f0fe38c13109f53d414162eaf9e635a09cc07bb7df5d008213b3
export const VAULT_CONTRACT_ADDRESS = '0x9b24ADD6fe458f1d620A17ceC8d20944C37296d7';
export const USDC_CONTRACT_ADDRESS = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

// Pimlico Bundler & Paymaster Endpoint Oficial de FlowFi (cargado desde .env)
export const PIMLICO_RPC_URL = import.meta.env.VITE_PIMLICO_RPC_URL || 'https://api.pimlico.io/v2/421614/rpc?apikey=YOUR_PIMLICO_API_KEY';

// ABI del contrato GasslessPilotVault (ERC-4626 + Aave V3, sin executeSignal)
// El deposit dispara automáticamente _deployToStrategy() hacia Aave
export const VAULT_ABI = [
  // --- ERC-4626 Core ---
  'function deposit(uint256 assets, address receiver) external returns (uint256 shares)',
  'function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares)',
  'function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets)',
  'function totalAssets() external view returns (uint256)',
  'function balanceOf(address user) external view returns (uint256)',
  'function convertToAssets(uint256 shares) external view returns (uint256)',
  'function convertToShares(uint256 assets) external view returns (uint256)',
  'function asset() external view returns (address)',
  'function totalSupply() external view returns (uint256)',
  // --- GasslessPilotVault Admin/Strategy ---
  'function rebalance(uint256 amountToSupply, uint256 amountToWithdraw) external',
  'function collectPerformanceFee() external',
  'function setTargetAllocation(uint256 _newAllocationBps) external',
  'function setPerformanceFee(uint256 _newFee) external',
  'function setTreasury(address _newTreasury) external',
  // --- View ---
  'function targetAllocationBps() external view returns (uint256)',
  'function performanceFee() external view returns (uint256)',
  'function treasury() external view returns (address)',
  'function aavePool() external view returns (address)',
  'function aToken() external view returns (address)',
  'function owner() external view returns (address)',
  // --- Events ---
  'event StrategyExecuted(uint256 amountToSupply, uint256 amountToWithdraw)',
  'event FeeCollected(address indexed treasury, uint256 amount)',
  'event TreasuryUpdated(address indexed newTreasury)',
  'event TargetAllocationUpdated(uint256 newAllocationBps)',
  'event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)',
  'event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)'
];

export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)'
];
