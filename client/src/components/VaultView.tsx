import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Layers,
  Info,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  Wallet,
  Activity,
  Zap,
  Gift,
  ShieldCheck,
  Fuel,
  Lock,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import { useVault, CONVERSION_RATE } from '../hooks/useVault';
import { useLanguage } from '../context/LanguageContext';
import { ARBITRUM_SEPOLIA_EXPLORER } from '../config/constants';
import { wdkGaslessService, GaslessAccountInfo, DepositQuoteResult } from '../services/wdkGaslessService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const VaultView: React.FC = () => {
  const { wallet, connectWallet } = useWeb3();
  const { metrics, isProcessing: isWeb3Processing, txHash: web3TxHash, error: web3Error, deposit: web3Deposit, withdraw: web3Withdraw, refetch } = useVault();
  const { t, language } = useLanguage();

  // Modo de billetera: 'gasless' (WDK Smart Account ERC-4337) o 'eoa' (MetaMask)
  const [walletMode, setWalletMode] = useState<'gasless' | 'eoa'>('gasless');
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState<string>('');

  // Estados específicos de WDK Gasless
  const [gaslessAccount, setGaslessAccount] = useState<GaslessAccountInfo | null>(null);
  const [quote, setQuote] = useState<DepositQuoteResult | null>(null);
  const [isGaslessProcessing, setIsGaslessProcessing] = useState(false);
  const [gaslessTxHash, setGaslessTxHash] = useState<string | null>(null);
  const [gaslessError, setGaslessError] = useState<string | null>(null);
  const [faucetSuccess, setFaucetSuccess] = useState<string | null>(null);

  // Cargar Smart Account de WDK Gasless
  const refreshGaslessAccount = async () => {
    try {
      const info = await wdkGaslessService.getAccountInfo();
      setGaslessAccount(info);
    } catch (e) {
      console.warn('Error al cargar cuenta WDK:', e);
    }
  };

  useEffect(() => {
    refreshGaslessAccount();
  }, []);

  // Actualizar cotización de comisión cuando cambia el monto
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      wdkGaslessService.quoteDeposit(amount).then(setQuote);
    } else {
      setQuote(null);
    }
  }, [amount]);

  // Reclamar Faucet de prueba en la demo (+100 USD₮)
  const handleClaimFaucet = async () => {
    setIsGaslessProcessing(true);
    setFaucetSuccess(null);
    setGaslessError(null);
    try {
      await wdkGaslessService.claimFaucetUsdt(100);
      await refreshGaslessAccount();
      refetch();
      setFaucetSuccess('100.00 USD₮ Demo acreditados. Saldo ETH nativo preservado en 0.0000.');
    } catch (e: any) {
      setGaslessError(e.message || 'Error claiming faucet.');
    } finally {
      setIsGaslessProcessing(false);
    }
  };

  // Manejar depósito / retiro
  const handleAction = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    if (walletMode === 'gasless') {
      setIsGaslessProcessing(true);
      setGaslessTxHash(null);
      setGaslessError(null);
      try {
        if (action === 'deposit') {
          const res = await wdkGaslessService.executeGaslessDeposit(amount);
          setGaslessTxHash(res.hash);
        } else {
          const res = await wdkGaslessService.executeGaslessWithdraw(amount);
          setGaslessTxHash(res.hash);
        }
        await refreshGaslessAccount();
        setAmount('');
        refetch();
      } catch (err: any) {
        setGaslessError(err.message || 'Error executing Gasless operation with Tether WDK.');
      } finally {
        setIsGaslessProcessing(false);
      }
    } else {
      // Modo MetaMask Tradicional
      if (action === 'deposit') {
        await web3Deposit(amount);
        setAmount('');
      } else {
        await web3Withdraw(amount);
        setAmount('');
      }
    }
  };

  const handlePreset = (preset: string) => {
    const available = walletMode === 'gasless'
      ? (action === 'deposit' ? gaslessAccount?.usdtBalance || '0' : metrics.userAssets)
      : (action === 'deposit' ? wallet.balance : metrics.userAssets);

    if (preset === 'MAX') {
      setAmount(available);
    } else if (preset === '50%') {
      const half = (parseFloat(available) / 2).toFixed(2);
      setAmount(half);
    } else {
      setAmount(preset.replace(',', ''));
    }
  };

  // Configuración de visualización del gráfico de la Bóveda
  const [chartTimeframe, setChartTimeframe] = useState<'7D' | '30D' | '90D'>('30D');
  const [chartMode, setChartMode] = useState<'vault' | 'user'>('vault');

  const userAssetsNum = parseFloat(metrics.userAssets) || 0;
  const userPrincipalNum = parseFloat(metrics.userPrincipal) || 0;
  const totalAssetsNum = parseFloat(metrics.totalAssets) || 0;

  // PnL Logic
  const pnl = userAssetsNum - userPrincipalNum;
  const pnlFormatted = pnl >= 0 ? `+$${pnl.toFixed(4)}` : `-$${Math.abs(pnl).toFixed(4)}`;
  const isProfit = pnl >= 0;
  const pnlPercent = userPrincipalNum > 0 ? (pnl / userPrincipalNum) * 100 : 0;

  // Curva de Rendimiento Institucional de la Bóveda (Aave V3 APY 8.03% continuo)
  const chartData = useMemo(() => {
    const days = chartTimeframe === '7D' ? 7 : chartTimeframe === '90D' ? 90 : 30;
    const baseAPY = 0.0803; // 8.03% APY base de Aave V3 en Arbitrum
    const dailyRate = Math.pow(1 + baseAPY, 1 / 365) - 1;
    
    // Si se selecciona la posición del usuario y tiene saldo, proyectar su capital; si no, usar $1,000 USD₮ para el índice institucional
    const isUserMode = chartMode === 'user' && userAssetsNum > 0;
    const baseCapital = isUserMode
      ? (userPrincipalNum > 0 ? userPrincipalNum : userAssetsNum)
      : 1000.0;

    const data = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayIndex = days - i;
      
      // Micro-variaciones realistas de mercado sobre la curva de interés continuo
      const noise = Math.sin(dayIndex * 0.4) * 0.0015;
      const compoundFactor = Math.pow(1 + dailyRate, dayIndex) * (1 + (noise * dayIndex / days));
      
      const valor = baseCapital * compoundFactor;
      const pnlDay = valor - baseCapital;
      const pnlPct = (compoundFactor - 1) * 100;
      const sharePrice = (1.0 + ((compoundFactor - 1) * 0.92)).toFixed(4); // NAV 1 fUSD = X USD₮

      data.push({
        date: d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
          month: 'short',
          day: 'numeric'
        }),
        timestamp: d.getTime(),
        valor: parseFloat(valor.toFixed(2)),
        pnl: parseFloat(pnlDay.toFixed(2)),
        pnlPct: parseFloat(pnlPct.toFixed(2)),
        sharePrice: parseFloat(sharePrice),
        apy: (baseAPY * 100 + noise * 100).toFixed(2),
        baseCapital
      });
    }

    // Asegurar que el punto final coincida con la posición real si está en modo usuario
    if (isUserMode && data.length > 0) {
      data[data.length - 1].valor = userAssetsNum;
      data[data.length - 1].pnl = userAssetsNum - userPrincipalNum;
    }

    return data;
  }, [chartTimeframe, chartMode, userAssetsNum, userPrincipalNum, language]);

  const currentTxHash = walletMode === 'gasless' ? gaslessTxHash : web3TxHash;
  const currentError = walletMode === 'gasless' ? gaslessError : web3Error;
  const currentProcessing = walletMode === 'gasless' ? isGaslessProcessing : isWeb3Processing;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-100 font-sans">
      
      {/* Banner Superior: Tether WDK Gasless Onboarding Header */}
      <div className="bg-[#0B1120] border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#009393]/15 border border-[#009393]/30 flex items-center justify-center text-[#00E5C9] shadow-[0_0_15px_rgba(0,147,147,0.25)] flex-shrink-0">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-white text-base tracking-tight">{t('vault.title')}</span>
              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                ERC-4337 & Pimlico Paymaster
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('vault.subtitle')}
            </p>
          </div>
        </div>

        {/* Selector de Modo de Billetera */}
        <div className="flex items-center bg-[#060913] border border-slate-800 rounded-2xl p-1 text-xs">
          <button
            onClick={() => setWalletMode('gasless')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              walletMode === 'gasless'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t('vault.modeWdk')}</span>
          </button>
          <button
            onClick={() => setWalletMode('eoa')}
            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              walletMode === 'eoa'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{t('vault.modeEoa')}</span>
          </button>
        </div>
      </div>

      {/* 1. Métricas Financieras del Usuario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Principal Invertido */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
            <span className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-400" />
              Capital Principal
            </span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">USD₮</span>
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            ${userPrincipalNum.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
            Aportación inicial neta en FlowFi Vault
          </div>
        </div>

        {/* Valor Actual de la Posición */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Valor Actual (fUSD)
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded">
              Activo
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            ${userAssetsNum.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
            {metrics.userShares} fUSD Shares · Arbitrum Sepolia
          </div>
        </div>

        {/* Rendimiento Neto Acumulado (PnL) */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              Rendimiento (PnL)
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isProfit ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
            </span>
          </div>
          <div className={`text-3xl font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pnlFormatted}
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
            Interés devengado automáticamente en Aave V3
          </div>
        </div>
      </div>

      {/* 2. Gráfico y Terminal de Operaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Columna Izquierda: Gráfico y Estado de Protocolo (7 de 12 columnas) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Gráfico de Evolución de Capital y Rendimiento de Bóveda */}
          <div className="glass-panel rounded-3xl p-6 flex flex-col min-h-[380px]">
            {/* Header del Gráfico */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Curva de Rendimiento de la Bóveda</h3>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    Aave V3 (8.03% APY)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {chartMode === 'user' && userAssetsNum > 0
                    ? `Evolución de tu posición ($${userAssetsNum.toFixed(2)} USD₮)`
                    : 'Crecimiento continuo compuesto indexado (Base $1,000 USD₮)'}
                </p>
              </div>

              {/* Controles: Timeframe & Modo de Vista */}
              <div className="flex items-center gap-2 flex-wrap">
                {userAssetsNum > 0 && (
                  <div className="flex bg-[#060913] border border-slate-800 rounded-xl p-0.5 text-[11px] font-mono">
                    <button
                      onClick={() => setChartMode('vault')}
                      className={`px-2 py-1 rounded-lg transition-all ${
                        chartMode === 'vault' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Bóveda
                    </button>
                    <button
                      onClick={() => setChartMode('user')}
                      className={`px-2 py-1 rounded-lg transition-all ${
                        chartMode === 'user' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Mi Posición
                    </button>
                  </div>
                )}

                <div className="flex bg-[#060913] border border-slate-800 rounded-xl p-0.5 text-[11px] font-mono">
                  {(['7D', '30D', '90D'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setChartTimeframe(tf)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        chartTimeframe === tf
                          ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contenedor del Gráfico Responsive */}
            <div className="w-full h-[260px] relative">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVaultYield" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[(dataMin: number) => Number((dataMin * 0.995).toFixed(2)), (dataMax: number) => Number((dataMax * 1.005).toFixed(2))]}
                    tickFormatter={(v) => `$${Number(v).toFixed(Number(v) < 50 ? 2 : 0)}`}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#0B1120] border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl font-mono text-xs space-y-1.5 backdrop-blur-md">
                            <div className="text-slate-400 text-[11px] pb-1 border-b border-slate-800 flex justify-between gap-4">
                              <span>{d.date}</span>
                              <span className="text-emerald-400 font-bold">APY {d.apy}%</span>
                            </div>
                            <div className="flex justify-between gap-4 pt-1">
                              <span className="text-slate-300">
                                {chartMode === 'user' && userAssetsNum > 0 ? 'Mi Posición:' : 'Valor Bóveda:'}
                              </span>
                              <span className="text-white font-bold">${Number(d.valor).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD₮</span>
                            </div>
                            <div className="flex justify-between gap-4 text-[11px]">
                              <span className="text-slate-400">Rendimiento:</span>
                              <span className="text-emerald-400 font-bold">+{d.pnlPct}% (+${Number(d.pnl).toFixed(4)} USD₮)</span>
                            </div>
                            <div className="flex justify-between gap-4 text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                              <span>NAV por Acción:</span>
                              <span className="text-slate-300 font-bold">1 fUSD = {d.sharePrice} USD₮</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVaultYield)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Badges de Información de Bóveda */}
            <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase">APY Promedio</span>
                <span className="text-emerald-400 font-bold">8.03% Anual</span>
              </div>
              <div className="flex flex-col text-center">
                <span className="text-[10px] text-slate-500 uppercase">Devengo de Interés</span>
                <span className="text-slate-200 font-bold">Por Bloque (~2s)</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-500 uppercase">NAV / Share Price</span>
                <span className="text-teal-300 font-bold">1.0182 USD₮</span>
              </div>
            </div>
          </div>

          {/* Tarjetas de Salud y Protocolo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel rounded-3xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Estrategia de Liquidez</span>
                <div className="text-base font-bold text-white mt-1">Aave V3 Liquidity Pool</div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Asignado a Préstamos:</span>
                  <span className="text-emerald-400 font-mono font-bold">100%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Comisión de Desempeño:</span>
                  <span className="text-slate-200 font-mono">10% s/ganancias</span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">TVL Total del Protocolo</span>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  ${totalAssetsNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD₮
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Smart Contract:</span>
                  <span className="text-emerald-400 font-mono">GasslessPilotVault</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Red:</span>
                  <span className="text-slate-200 font-mono">Arbitrum Sepolia</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Terminal de Depósito / Retiro (5 de 12 columnas) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            {/* Selector de Acción */}
            <div className="flex bg-[#060913] border border-slate-800 rounded-2xl p-1 mb-5">
              <button
                onClick={() => setAction('deposit')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  action === 'deposit'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>{t('vault.tabDeposit')}</span>
              </button>
              <button
                onClick={() => setAction('withdraw')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  action === 'withdraw'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                <span>{t('vault.tabWithdraw')}</span>
              </button>
            </div>

            {/* Smart Account Gasless Card */}
            {walletMode === 'gasless' && (
              <div className="bg-[#060913] border border-emerald-500/20 rounded-2xl p-4 mb-4 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Smart Account (ERC-4337):</span>
                  <span className="text-emerald-400 font-bold truncate max-w-[150px]">
                    {gaslessAccount ? `${gaslessAccount.address.slice(0, 6)}...${gaslessAccount.address.slice(-4)}` : 'Iniciando...'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Gas ETH:</span>
                    <span className="text-slate-400">0.0000 ETH</span>
                  </div>
                  <div className="font-bold text-emerald-300">
                    USD₮: ${gaslessAccount?.usdtBalance || '0.00'}
                  </div>
                </div>

                {/* Botón Faucet Demo */}
                <button
                  onClick={handleClaimFaucet}
                  disabled={isGaslessProcessing}
                  className="w-full mt-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>{isGaslessProcessing ? t('vault.faucetClaiming') : t('vault.faucetClaim')}</span>
                </button>
              </div>
            )}

            {/* Input de Monto */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>{action === 'deposit' ? t('vault.amountInputLabel') : t('vault.sharesBurnLabel')}</span>
                <span className="text-white">
                  Disponible: {walletMode === 'gasless'
                    ? `${gaslessAccount?.usdtBalance || '0.00'} USD₮`
                    : `${action === 'deposit' ? wallet.balance : userAssetsNum.toFixed(2)} ${action === 'deposit' ? 'ETH' : 'fUSD'}`}
                </span>
              </div>

              <div className="bg-[#060913] border border-slate-800 focus-within:border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between transition-all">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent text-2xl font-mono font-bold text-white outline-none w-1/2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-bold font-mono">
                    <span className="text-emerald-400">₮</span>
                    <span>USD₮</span>
                  </div>
                  <button
                    onClick={() => handlePreset('MAX')}
                    className="text-xs font-bold text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 transition-colors font-mono"
                  >
                    {t('vault.btnMax')}
                  </button>
                </div>
              </div>
            </div>

            {/* Presets de Monto Rápido */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {['10', '25', '50', '50%'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePreset(preset)}
                  className="bg-[#060913] hover:bg-slate-800 border border-slate-800 text-xs py-2 rounded-xl text-slate-300 font-mono font-medium transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Desglose de Operación */}
            <div className="bg-[#060913] border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>{t('vault.sharesOutputLabel')}:</span>
                <span className="text-white font-bold">
                  {amount ? (parseFloat(amount) / CONVERSION_RATE).toFixed(4) : '0.0000'} fUSD
                </span>
              </div>

              {walletMode === 'gasless' && (
                <>
                  <div className="flex justify-between text-emerald-300 pt-1.5 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" />
                      {t('vault.gasEstimate')}:
                    </span>
                    <span className="font-bold">
                      {quote ? `~${quote.estimatedFeeUsdt} USD₮` : '~0.12 USD₮'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{t('vault.balanceEth')}:</span>
                    <span className="text-emerald-400 font-bold">0.0000 ETH ({t('vault.gasFreeSponsored')})</span>
                  </div>
                </>
              )}
            </div>

            {/* Notificaciones de Estado */}
            {faucetSuccess && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-mono animate-in fade-in">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{faucetSuccess}</span>
              </div>
            )}

            {currentError && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300 font-mono animate-in fade-in">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{currentError}</span>
              </div>
            )}

            {currentTxHash && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-400 font-mono animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Transacción Confirmada</span>
                </div>
                <a
                  href={`${ARBITRUM_SEPOLIA_EXPLORER}/tx/${currentTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-300 underline underline-offset-2"
                >
                  <span>Arbiscan</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Botón Principal de Ejecución */}
          <div className="mt-6">
            {walletMode === 'eoa' && !wallet.isConnected ? (
              <button
                onClick={connectWallet}
                disabled={wallet.isConnecting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                {wallet.isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                <span>{wallet.isConnecting ? '...' : t('nav.connectWallet')}</span>
              </button>
            ) : (
              <button
                onClick={handleAction}
                disabled={currentProcessing || !amount || parseFloat(amount) <= 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {currentProcessing && <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />}
                <span>
                  {currentProcessing
                    ? t('vault.processing')
                    : walletMode === 'gasless'
                    ? t('vault.btnDepositWdk')
                    : action === 'deposit'
                    ? t('vault.btnDepositEoa')
                    : t('vault.btnWithdrawEoa')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
