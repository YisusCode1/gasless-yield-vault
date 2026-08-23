import React, { useMemo, useState } from 'react';
import { Shield, Flame, Scale, ExternalLink, RefreshCw, CheckCircle, Activity, AlertTriangle, ChevronRight, Terminal, Filter, Cpu, Zap, Lock, BarChart3, LineChart } from 'lucide-react';
import { useStrategy } from '../hooks/useStrategy';
import { useLanguage } from '../context/LanguageContext';
import { ARBITRUM_SEPOLIA_EXPLORER } from '../config/constants';
import { RiskMode, RiskModeInfo, HistoricalYieldItem } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

type Timeframe = '7D' | '30D' | 'ALL';

// Custom Tooltip with Glassmorphism and mono fonts
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as HistoricalYieldItem;
    const date = new Date(data.timestamp);
    const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return (
      <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-xl">
        <p className="text-slate-400 text-[10px] mb-2 font-mono uppercase tracking-wider">{dateString}</p>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
          <span className="text-xs font-bold text-white font-mono">APY: {data.apy.toFixed(2)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_6px_#06B6D4]" />
          <span className="text-[11px] text-slate-300 font-mono">TVL Pool: ${(data.tvlUsd / 1_000_000).toFixed(2)}M</span>
        </div>
      </div>
    );
  }
  return null;
};

export const EstrategiaIAView: React.FC = () => {
  const {
    riskMode,
    setRiskMode,
    riskModes,
    strategy,
    isLoading,
    isExecuting,
    executionResult,
    executeStrategy,
    fetchStrategy,
    fetchError,
    historicalData,
    isLoadingHistory
  } = useStrategy();
  const { t } = useLanguage();

  const [timeframe, setTimeframe] = useState<Timeframe>('30D');

  const defaultModes: RiskModeInfo[] = [
    {
      id: 'conservador', name: t('strategy.riskConservative'), description: 'Capital preservation (Max 80%).', max_exposure: 0.80, risk_level: 'Low', color: 'emerald', cooldown_hours: 24
    },
    {
      id: 'moderado', name: t('strategy.riskModerate'), description: 'Sharpe ratio optimization (Max 95%).', max_exposure: 0.95, risk_level: 'Medium', color: 'cyan', cooldown_hours: 8
    },
    {
      id: 'agresivo', name: t('strategy.riskAggressive'), description: 'Dynamic APY maximization (Max 100%).', max_exposure: 1.0, risk_level: 'High', color: 'amber', cooldown_hours: 2
    }
  ];

  const modesToRender = riskModes.length > 0 ? riskModes : defaultModes;
  const currentModeInfo = modesToRender.find((m) => m.id === riskMode) || defaultModes[1];
  const market = strategy.market_data;

  // Filter historical data based on timeframe
  const chartData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];
    
    let sliceAmount = historicalData.length;
    if (timeframe === '7D') sliceAmount = 7;
    if (timeframe === '30D') sliceAmount = 30;
    
    return historicalData.slice(-sliceAmount);
  }, [historicalData, timeframe]);

  // Visual Helpers
  const getActionColor = (action: string) => {
    if (action === 'SUPPLY' || action === 'DEPOSITAR') return 'text-emerald-400';
    if (action === 'WITHDRAW' || action === 'RETIRAR') return 'text-rose-400';
    return 'text-teal-400';
  };

  const getHealthColor = (hf: number) => {
    if (hf < 1.1) return 'text-rose-400';
    if (hf < 1.5) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const getAiRationale = (action: string) => {
    if (action === 'SUPPLY' || action === 'DEPOSITAR') {
      return 'Optimal reserve utilization and positive yield spread in Aave V3. Volatility contained with low risk of liquidity deficit.';
    }
    if (action === 'WITHDRAW' || action === 'RETIRAR') {
      return 'Elevated borrow demand or spread compression. Temporary reallocation to liquid reserves recommended.';
    }
    return 'Market equilibrium conditions. Maintain current asset distribution to prevent rebalancing overhead.';
  };

  const mapActionToInstitutional = (action: string) => {
    if (action === 'SUPPLY' || action === 'DEPOSITAR') return 'SUPPLY (DEPLOY)';
    if (action === 'WITHDRAW' || action === 'RETIRAR') return 'WITHDRAW (UNWIND)';
    return 'HOLD (MAINTAIN)';
  };

  const actionDisplay = mapActionToInstitutional(strategy.action);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-100 font-sans">
      
      {/* 0. Alerta de Sistema */}
      {fetchError && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-rose-300 text-xs uppercase font-mono">Quant Alert</h3>
            <p className="text-xs text-rose-200/80 mt-1">{fetchError}</p>
          </div>
        </div>
      )}

      {/* 1. Header: AI Quant Live Feed */}
      <div className="bg-[#0B1120] border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] flex-shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{t('strategy.title')}</span>
              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('strategy.subtitle')}
            </p>
          </div>
        </div>

        {/* Métricas Resumidas */}
        <div className="flex items-center gap-4 text-xs font-mono bg-[#060913] border border-slate-800 px-4 py-2.5 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400">
            <span>SIGNAL:</span>
            <span className={`font-bold ${getActionColor(strategy.action)}`}>{actionDisplay}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2 text-slate-400">
            <span>CONFIDENCE:</span>
            <span className="text-emerald-400 font-bold">{(strategy.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2 text-slate-400">
            <span>TARGET APY:</span>
            <span className="text-teal-400 font-bold">{strategy.estimated_apy.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* 2. Selector de Perfil de Riesgo & Botón de Actualizar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-[#0B1120] border border-slate-800 p-1 rounded-2xl flex items-center max-w-fit">
          {modesToRender.map((mode) => {
            const isActive = riskMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setRiskMode(mode.id as RiskMode)}
                className={`relative px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-slate-800 border border-slate-700 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {mode.id === 'conservador' && <Shield className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : ''}`} />}
                  {mode.id === 'moderado' && <Scale className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : ''}`} />}
                  {mode.id === 'agresivo' && <Flame className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : ''}`} />}
                  <span>{mode.name}</span>
                </div>
              </button>
            );
          })}
        </div>
        
        <button 
          onClick={() => fetchStrategy()} 
          disabled={isLoading} 
          className="flex items-center justify-center gap-2 text-xs text-slate-300 bg-[#0B1120] hover:bg-slate-800 transition-colors px-4 py-2.5 rounded-2xl border border-slate-800 disabled:opacity-50 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{isLoading ? '...' : t('strategy.btnRebalance')}</span>
        </button>
      </div>

      {/* 3. Grid Principal: Gráfico Histórico (8 cols) + Terminal Cuantitativo (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Columna Izquierda: Gráfico Histórico de APY */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 flex flex-col min-h-[440px] shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-white font-mono">{t('strategy.chartTitle')}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
                Aave V3 Arbitrum
              </span>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center bg-[#060913] border border-slate-800 rounded-xl p-1">
              {(['7D', '30D', 'ALL'] as Timeframe[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-[10px] font-mono rounded-lg transition-colors ${
                    timeframe === tf 
                      ? 'bg-slate-800 text-white font-bold border border-slate-700' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full relative">
            {isLoadingHistory ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mb-3 text-emerald-400" />
                LOADING HISTORICAL METRICS...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatXAxis} 
                    stroke="#64748B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    className="font-mono"
                  />
                  <YAxis 
                    stroke="#64748B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`}
                    className="font-mono"
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  
                  <Area 
                    type="monotone" 
                    dataKey="apy" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorApy)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-xs">
                NO HISTORICAL DATA AVAILABLE
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Terminal de Inferencia & Límites Matemáticos */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Inspector de Fundamento Cuantitativo */}
          <div className="bg-[#0B1120] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3.5 font-mono text-xs">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-white tracking-wider uppercase text-[11px]">{t('strategy.llmTitle')}</span>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Pool:</span>
                <span className="text-white font-bold">Aave V3 Liquidity</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className={`${getActionColor(strategy.action)} font-bold`}>{actionDisplay}</span>
              </div>

              <div className="pt-2">
                <span className="text-slate-400 text-[11px]">Reasoning:</span>
                <div className="mt-1.5 p-3 bg-[#060913] rounded-xl border border-slate-800 text-slate-300 italic text-[11px] leading-relaxed border-l-2 border-l-emerald-500">
                  "{getAiRationale(strategy.action)}"
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="text-emerald-400 font-bold">{(strategy.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#060913] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_8px_#10B981]"
                    style={{ width: `${strategy.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Límites de Riesgo y Botón de Ejecución */}
          <div className="glass-panel rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">{t('strategy.riskProfile')}</h3>
            </div>
            
            {market ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#060913] p-3 rounded-2xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">{t('strategy.healthFactor')}</div>
                    <div className={`text-base font-bold mt-1 ${getHealthColor(market.health_factor)}`}>
                      {market.health_factor > 100 ? 'SAFE (>100)' : market.health_factor.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-[#060913] p-3 rounded-2xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">{t('strategy.targetAllocation')}</div>
                    <div className="text-base font-bold text-white mt-1">{(currentModeInfo.max_exposure * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div className="bg-[#060913] p-3.5 rounded-2xl border border-slate-800">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>{t('strategy.utilization')}:</span>
                    <span className="text-emerald-400 font-bold">{(market.utilization_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${market.utilization_rate * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
              </div>
            )}

            {/* Botón de Ejecución de Estrategia */}
            <button
              onClick={executeStrategy}
              disabled={isExecuting || isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('strategy.rebalancing')}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>{t('strategy.btnRebalance')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Resultado de Ejecución */}
      {executionResult && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-mono font-bold text-emerald-300 text-xs uppercase">Estrategia Ejecutada con Éxito</h4>
              <p className="font-mono text-xs text-slate-300 mt-0.5">{executionResult.message}</p>
            </div>
          </div>
          {executionResult.txHash && (
            <a
              href={`${ARBITRUM_SEPOLIA_EXPLORER}/tx/${executionResult.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#0B1120] hover:bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-xs px-4 py-2.5 rounded-xl transition-colors"
            >
              <span>Ver en Arbiscan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

    </div>
  );
};
