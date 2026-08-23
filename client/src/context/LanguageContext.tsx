import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Navbar
    'nav.home': 'Inicio',
    'nav.vault': 'Bóveda Vault',
    'nav.strategy': 'Estrategia IA',
    'nav.activity': 'Libro Contable',
    'nav.howItWorks': 'Cómo Funciona',
    'nav.connectWallet': 'Conectar Billetera',
    'nav.disconnect': 'Desconectar',
    'nav.wdkBadge': 'Tether WDK Gasless',
    'nav.network': 'Arbitrum Sepolia',
    'nav.lang': 'ES',

    // Home
    'home.badge': 'Arbitrum Sepolia · Tether WDK Track 2',
    'home.heroTitle1': 'Rendimiento Cuantitativo DeFi',
    'home.heroTitle2': 'Sin Gas Nativo',
    'home.heroDesc': 'FlowFi combina la Abstracción de Cuentas (ERC-4337) de Tether WDK con oráculos de inferencia LLM en Gemini 2.5 Flash y contratos ERC-4626 para optimizar capital en Aave V3 con 0.00 ETH requerido.',
    'home.statApy': 'APY Actual Optimizado',
    'home.statApySub': 'Inferencia Cuantitativa',
    'home.statTvl': 'TVL Bajo Gestión',
    'home.statTvlSub': 'Pool Aave V3 Liquidity',
    'home.statGas': 'Gas Nativo Requerido',
    'home.statGasSub': 'Patrocinado / Pagado en USD₮',
    'home.statExecution': 'Tiempo de Ejecución',
    'home.statExecutionSub': 'Liquidación Arbitrum Sepolia',
    'home.pillar1Title': 'Onboarding Sin Gas (WDK)',
    'home.pillar1Desc': 'Empaquetado atómico de approve y deposit en una sola UserOperation procesada por Pimlico Paymaster. Cero necesidad de adquirir ETH.',
    'home.pillar2Title': 'Inferencia Cuantitativa LLM',
    'home.pillar2Desc': 'Gemini 2.5 Flash evalúa en tiempo real utilización de reservas, volatilidad de tasas y ratios de riesgo para emitir decisiones de rebalanceo.',
    'home.pillar3Title': 'Bóveda Autónoma ERC-4626',
    'home.pillar3Desc': 'Contrato GasslessPilotVault en Arbitrum Sepolia que suministra liquidez directamente a Aave V3 con cálculo dinámico de acciones fUSD.',
    'home.ctaVault': 'Abrir Terminal Vault',
    'home.ctaHowItWorks': 'Ver Arquitectura Técnica',

    // Vault
    'vault.title': 'Terminal de Operaciones Vault',
    'vault.subtitle': 'Bóveda ERC-4626 autónoma conectada al pool de liquidez Aave V3 en Arbitrum Sepolia.',
    'vault.accountMode': 'Modo de Cuenta',
    'vault.modeWdk': 'Tether WDK Gasless (0 ETH)',
    'vault.modeEoa': 'MetaMask EOA (Con Gas ETH)',
    'vault.wdkBannerTitle': 'Sesión WDK Gasless Activa',
    'vault.wdkBannerDesc': 'Estás operando mediante una Smart Account ERC-4337. El gas es liquidado en USD₮ o patrocinado por Pimlico Paymaster.',
    'vault.balanceEth': 'Saldo ETH Nativo',
    'vault.balanceUsdt': 'Saldo Disponible USD₮',
    'vault.sharesBalance': 'Participación (fUSD Shares)',
    'vault.sharesValue': 'Equivalente en Activos Subyacentes',
    'vault.tabDeposit': 'Depositar USD₮',
    'vault.tabWithdraw': 'Retirar Fondos',
    'vault.faucetClaim': 'Reclamar Faucet Demo (+100 USD₮)',
    'vault.faucetClaiming': 'Acreditando Fondos Demo...',
    'vault.amountInputLabel': 'Monto a transferir',
    'vault.sharesOutputLabel': 'Acciones a recibir (fUSD Shares)',
    'vault.sharesBurnLabel': 'Acciones a quemar (fUSD Shares)',
    'vault.assetsReturnLabel': 'Activo a recibir (USD₮)',
    'vault.btnMax': 'MÁX',
    'vault.btnHalf': '50%',
    'vault.gasEstimate': 'Tarifa Estimada de Gas',
    'vault.gasFreeSponsored': '0.00 USD₮ (Patrocinado por Paymaster)',
    'vault.gasPaidUsdt': 'Liquidado en USD₮',
    'vault.btnDepositWdk': 'Ejecutar Depósito Gasless (0 ETH)',
    'vault.btnDepositEoa': 'Depositar USD₮ con MetaMask',
    'vault.btnWithdrawWdk': 'Retirar Fondos (Gasless)',
    'vault.btnWithdrawEoa': 'Retirar Fondos con MetaMask',
    'vault.processing': 'Procesando Transacción On-Chain...',
    'vault.noticeZeroEth': 'Garantía Gasless: No necesitas saldo en ETH. La transacción se agrupa atómicamente.',
    'vault.apyCard': 'Tasa APY Estimada',
    'vault.utilizationCard': 'Utilización Aave V3',

    // Strategy / Quant
    'strategy.title': 'Cockpit de Estrategia Cuantitativa e IA',
    'strategy.subtitle': 'Monitoreo de parámetros de riesgo, inferencia de asignación y oráculo algorítmico.',
    'strategy.healthFactor': 'Health Factor Estimado',
    'strategy.healthFactorStatus': 'Parámetro Seguro (> 1.5)',
    'strategy.sharpeRatio': 'Sharpe Ratio Proyectado',
    'strategy.sharpeRatioStatus': 'Eficiencia Riesgo-Retorno',
    'strategy.utilization': 'Utilización Pool Aave V3',
    'strategy.utilizationStatus': 'Capacidad Óptima',
    'strategy.targetAllocation': 'Asignación Objetivo Aave',
    'strategy.targetAllocationStatus': 'Despliegue de Liquidez',
    'strategy.riskProfile': 'Perfil de Exposición Cuantitativa',
    'strategy.riskConservative': 'Conservador (Max 80%)',
    'strategy.riskModerate': 'Moderado (Max 95%)',
    'strategy.riskAggressive': 'Agresivo (Max 100%)',
    'strategy.llmTitle': 'Dictamen de Inferencia Cuantitativa — Gemini 2.5 Flash',
    'strategy.llmModel': 'Modelo: Gemini 2.5 Flash Quant · Temperatura: 0.1',
    'strategy.btnRebalance': 'Ejecutar Rebalanceo On-Chain',
    'strategy.rebalancing': 'Firmando y Transmitiendo Transacción...',
    'strategy.chartTitle': 'Historial de Rendimiento y APY',
    'strategy.tf7d': '7D',
    'strategy.tf30d': '30D',
    'strategy.tfAll': 'TODO',

    // Activity
    'activity.title': 'Libro Contable de Actividad',
    'activity.subtitle': 'Registro auditable on-chain de eventos del vault en Arbitrum Sepolia.',
    'activity.eventsCount': 'Eventos Registrados',
    'activity.totalDeposited': 'Depósitos Totales',
    'activity.totalWithdrawn': 'Retiros Totales',
    'activity.tabAll': 'Todos los Eventos',
    'activity.tabDeposits': 'Depósitos',
    'activity.tabWithdrawals': 'Retiros',
    'activity.exportCsv': 'Exportar CSV',
    'activity.thDate': 'Fecha / Hora',
    'activity.thType': 'Tipo',
    'activity.thDesc': 'Descripción',
    'activity.thProtocol': 'Protocolo',
    'activity.thAmount': 'Monto',
    'activity.thShares': 'Shares (fUSD)',
    'activity.thStatus': 'Estado',
    'activity.thTx': 'Transacción',
    'activity.empty': 'No se encontraron registros de transacciones para la billetera actual.',
    'activity.emptySub': 'Ejecuta un depósito o retiro en el Vault para ver la actividad en tiempo real.',

    // How it works
    'how.title': 'Arquitectura Técnica de FlowFi',
    'how.subtitle': 'Desglose del protocolo en 4 capas: Abstracción de Cuentas WDK, Inferencia Cuantitativa, Bóveda ERC-4626 y Pools Aave V3.',
    'how.layer1Num': 'Capa 1',
    'how.layer1Title': 'Abstracción de Cuentas (Tether WDK)',
    'how.layer1Desc': 'Instanciación de billeteras ERC-4337 que encapsulan approve y deposit en una sola UserOperation. El usuario opera con 0 ETH pagando tarifas en USD₮ o vía patrocinio de Paymaster.',
    'how.layer2Num': 'Capa 2',
    'how.layer2Title': 'Inferencia Cuantitativa (Gemini 2.5 Flash)',
    'how.layer2Desc': 'El agente procesa datos on-chain de tasas de interés y utilización de reservas de Aave V3 para determinar la asignación óptima de liquidez con salvaguardas paramétricas.',
    'how.layer3Num': 'Capa 3',
    'how.layer3Title': 'Bóveda Autónoma (GasslessPilotVault)',
    'how.layer3Desc': 'Smart Contract ERC-4626 en Arbitrum Sepolia que custodia activos, emite acciones fUSD y gestiona el flujo de capital hacia la estrategia.',
    'how.layer4Num': 'Capa 4',
    'how.layer4Title': 'Generación de Rendimiento (Aave V3)',
    'how.layer4Desc': 'El capital desplegado genera intereses continuos mediante el suministro al pool de préstamos descentralizado de Aave V3 en Arbitrum.',
    'how.securityTitle': 'Garantías Criptográficas y de Seguridad',
    'how.sec1Title': 'Custodia No Permisionada',
    'how.sec1Desc': 'Tus fondos permanecen siempre bajo tu control criptográfico. Los contratos no permiten retiros arbitrarios de terceros.',
    'how.sec2Title': 'Liquidación Inmediata',
    'how.sec2Desc': 'Retiros directos en cualquier bloque contra la liquidez suministrada al pool de Aave V3.',
    'how.sec3Title': 'Auditable On-Chain',
    'how.sec3Desc': 'Cada operación, depósito, asignación y cálculo de acciones fUSD es públicamente verificable en Arbiscan.',
    'how.ctaBtn': 'Comenzar a Depositar en FlowFi',

    // Footer
    'footer.desc': 'Tether WDK Gasless & Quant Yield Protocol',
    'footer.subdesc': 'Tether WDK Gasless Onboarding · ERC-4337 · Pimlico Paymaster · Arbitrum Sepolia',
    'footer.github': 'GitHub',
    'footer.contract': 'Arbiscan Contract'
  },
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.vault': 'Vault Terminal',
    'nav.strategy': 'AI Strategy',
    'nav.activity': 'Ledger',
    'nav.howItWorks': 'How It Works',
    'nav.connectWallet': 'Connect Wallet',
    'nav.disconnect': 'Disconnect',
    'nav.wdkBadge': 'Tether WDK Gasless',
    'nav.network': 'Arbitrum Sepolia',
    'nav.lang': 'EN',

    // Home
    'home.badge': 'Arbitrum Sepolia · Tether WDK Track 2',
    'home.heroTitle1': 'DeFi Quantitative Yield',
    'home.heroTitle2': 'Without Native Gas',
    'home.heroDesc': 'FlowFi combines Tether WDK Account Abstraction (ERC-4337) with Gemini 2.5 Flash LLM quantitative oracles and ERC-4626 contracts to optimize capital in Aave V3 with 0.00 ETH required.',
    'home.statApy': 'Current Optimized APY',
    'home.statApySub': 'Quantitative Inference',
    'home.statTvl': 'TVL Under Management',
    'home.statTvlSub': 'Aave V3 Liquidity Pool',
    'home.statGas': 'Native Gas Required',
    'home.statGasSub': 'Sponsored / Settled in USD₮',
    'home.statExecution': 'Execution Time',
    'home.statExecutionSub': 'Arbitrum Sepolia Settlement',
    'home.pillar1Title': 'Gasless Onboarding (WDK)',
    'home.pillar1Desc': 'Atomic batching of approve and deposit into a single UserOperation processed by Pimlico Paymaster. Zero need to purchase ETH.',
    'home.pillar2Title': 'LLM Quantitative Inference',
    'home.pillar2Desc': 'Gemini 2.5 Flash monitors reserve utilization, rate volatility, and risk ratios in real time to trigger rebalancing decisions.',
    'home.pillar3Title': 'Autonomous ERC-4626 Vault',
    'home.pillar3Desc': 'GasslessPilotVault contract on Arbitrum Sepolia that deploys liquidity into Aave V3 with dynamic fUSD shares computation.',
    'home.ctaVault': 'Open Vault Terminal',
    'home.ctaHowItWorks': 'View Technical Architecture',

    // Vault
    'vault.title': 'Vault Operations Terminal',
    'vault.subtitle': 'Autonomous ERC-4626 vault connected to Aave V3 liquidity pool on Arbitrum Sepolia.',
    'vault.accountMode': 'Account Mode',
    'vault.modeWdk': 'Tether WDK Gasless (0 ETH)',
    'vault.modeEoa': 'MetaMask EOA (Standard Gas)',
    'vault.wdkBannerTitle': 'Active WDK Gasless Session',
    'vault.wdkBannerDesc': 'You are operating via an ERC-4337 Smart Account. Gas is settled in USD₮ or sponsored by Pimlico Paymaster.',
    'vault.balanceEth': 'Native ETH Balance',
    'vault.balanceUsdt': 'Available USD₮ Balance',
    'vault.sharesBalance': 'Holding (fUSD Shares)',
    'vault.sharesValue': 'Underlying Asset Equivalent',
    'vault.tabDeposit': 'Deposit USD₮',
    'vault.tabWithdraw': 'Withdraw Funds',
    'vault.faucetClaim': 'Claim Demo Faucet (+100 USD₮)',
    'vault.faucetClaiming': 'Crediting Demo Funds...',
    'vault.amountInputLabel': 'Amount to transfer',
    'vault.sharesOutputLabel': 'Shares to receive (fUSD Shares)',
    'vault.sharesBurnLabel': 'Shares to burn (fUSD Shares)',
    'vault.assetsReturnLabel': 'Asset to receive (USD₮)',
    'vault.btnMax': 'MAX',
    'vault.btnHalf': '50%',
    'vault.gasEstimate': 'Estimated Gas Fee',
    'vault.gasFreeSponsored': '0.00 USD₮ (Sponsored by Paymaster)',
    'vault.gasPaidUsdt': 'Settled in USD₮',
    'vault.btnDepositWdk': 'Execute Gasless Deposit (0 ETH)',
    'vault.btnDepositEoa': 'Deposit USD₮ with MetaMask',
    'vault.btnWithdrawWdk': 'Withdraw Funds (Gasless)',
    'vault.btnWithdrawEoa': 'Withdraw Funds with MetaMask',
    'vault.processing': 'Processing On-Chain Transaction...',
    'vault.noticeZeroEth': 'Gasless Guarantee: No ETH balance needed. Transactions are batched atomically.',
    'vault.apyCard': 'Estimated APY Rate',
    'vault.utilizationCard': 'Aave V3 Utilization',

    // Strategy / Quant
    'strategy.title': 'Quantitative & AI Strategy Cockpit',
    'strategy.subtitle': 'Risk parameter monitoring, allocation inference, and algorithmic oracle.',
    'strategy.healthFactor': 'Estimated Health Factor',
    'strategy.healthFactorStatus': 'Safe Parameter (> 1.5)',
    'strategy.sharpeRatio': 'Projected Sharpe Ratio',
    'strategy.sharpeRatioStatus': 'Risk-Return Efficiency',
    'strategy.utilization': 'Aave V3 Pool Utilization',
    'strategy.utilizationStatus': 'Optimal Capacity',
    'strategy.targetAllocation': 'Aave Target Allocation',
    'strategy.targetAllocationStatus': 'Liquidity Deployment',
    'strategy.riskProfile': 'Quantitative Exposure Profile',
    'strategy.riskConservative': 'Conservative (Max 80%)',
    'strategy.riskModerate': 'Moderate (Max 95%)',
    'strategy.riskAggressive': 'Aggressive (Max 100%)',
    'strategy.llmTitle': 'Quantitative Inference Verdict — Gemini 2.5 Flash',
    'strategy.llmModel': 'Model: Gemini 2.5 Flash Quant · Temperature: 0.1',
    'strategy.btnRebalance': 'Execute On-Chain Rebalance',
    'strategy.rebalancing': 'Signing & Broadcasting Transaction...',
    'strategy.chartTitle': 'Performance & APY History',
    'strategy.tf7d': '7D',
    'strategy.tf30d': '30D',
    'strategy.tfAll': 'ALL',

    // Activity
    'activity.title': 'Activity Ledger',
    'activity.subtitle': 'On-chain auditable ledger of vault events on Arbitrum Sepolia.',
    'activity.eventsCount': 'Recorded Events',
    'activity.totalDeposited': 'Total Deposits',
    'activity.totalWithdrawn': 'Total Withdrawals',
    'activity.tabAll': 'All Events',
    'activity.tabDeposits': 'Deposits',
    'activity.tabWithdrawals': 'Withdrawals',
    'activity.exportCsv': 'Export CSV',
    'activity.thDate': 'Date / Time',
    'activity.thType': 'Type',
    'activity.thDesc': 'Description',
    'activity.thProtocol': 'Protocol',
    'activity.thAmount': 'Amount',
    'activity.thShares': 'Shares (fUSD)',
    'activity.thStatus': 'Status',
    'activity.thTx': 'Transaction',
    'activity.empty': 'No transaction records found for the current wallet.',
    'activity.emptySub': 'Execute a deposit or withdrawal in the Vault to view real-time activity.',

    // How it works
    'how.title': 'FlowFi Technical Architecture',
    'how.subtitle': '4-layer protocol breakdown: WDK Account Abstraction, Quantitative Inference, ERC-4626 Vault, and Aave V3 Pools.',
    'how.layer1Num': 'Layer 1',
    'how.layer1Title': 'Account Abstraction (Tether WDK)',
    'how.layer1Desc': 'ERC-4337 smart wallet instances bundling approve and deposit in a single UserOperation. Users operate with 0 ETH paying gas in USD₮ or via Paymaster sponsorship.',
    'how.layer2Num': 'Layer 2',
    'how.layer2Title': 'Quantitative Inference (Gemini 2.5 Flash)',
    'how.layer2Desc': 'The agent analyzes live on-chain rate data and reserve utilization from Aave V3 to compute optimal liquidity allocation with parametric risk limits.',
    'how.layer3Num': 'Layer 3',
    'how.layer3Title': 'Autonomous Vault (GasslessPilotVault)',
    'how.layer3Desc': 'ERC-4626 Smart Contract on Arbitrum Sepolia safeguarding assets, minting fUSD shares, and routing capital to the yield strategy.',
    'how.layer4Num': 'Layer 4',
    'how.layer4Title': 'Yield Generation (Aave V3)',
    'how.layer4Desc': 'Deployed capital earns continuous interest by supplying to the Aave V3 decentralized lending pool on Arbitrum.',
    'how.securityTitle': 'Cryptographic & Security Guarantees',
    'how.sec1Title': 'Non-Permissioned Custody',
    'how.sec1Desc': 'Your funds always remain under your cryptographic control. Contracts forbid arbitrary third-party withdrawals.',
    'how.sec2Title': 'Instant Settlement',
    'how.sec2Desc': 'Direct withdrawals in any block against supplied liquidity in the Aave V3 pool.',
    'how.sec3Title': 'Auditable On-Chain',
    'how.sec3Desc': 'Every operation, deposit, allocation, and fUSD share computation is publicly verifiable on Arbiscan.',
    'how.ctaBtn': 'Start Depositing in FlowFi',

    // Footer
    'footer.desc': 'Tether WDK Gasless & Quant Yield Protocol',
    'footer.subdesc': 'Tether WDK Gasless Onboarding · ERC-4337 · Pimlico Paymaster · Arbitrum Sepolia',
    'footer.github': 'GitHub',
    'footer.contract': 'Arbiscan Contract'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('flowfi_language') as Language;
    return saved === 'en' || saved === 'es' ? saved : 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('flowfi_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['es']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
