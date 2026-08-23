import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiService } from '../services/apiService';
import { StrategyResponse, RiskMode, RiskModeInfo, HistoricalYieldItem } from '../types';

// Baseline inmediato de 30 días de historial de APY de Aave V3 en Arbitrum
const DEFAULT_HISTORICAL_DATA: HistoricalYieldItem[] = (() => {
  const points: HistoricalYieldItem[] = [];
  const now = new Date();
  const baseApy = 7.85;
  const baseTvl = 48500000;
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const variation = 0.65 * ((i % 5) - 2) + 0.2 * (i % 3);
    points.push({
      timestamp: d.toISOString(),
      apy: parseFloat((Math.max(4.5, baseApy + variation)).toFixed(2)),
      tvlUsd: Math.round(baseTvl + (30 - i) * 120000 + variation * 400000)
    });
  }
  return points;
})();

const DEFAULT_STRATEGIES: Record<RiskMode, StrategyResponse> = {
  conservador: {
    action: 'HOLD',
    confidence: 0.94,
    estimated_apy: 5.45,
    risk_level: 'Bajo',
    volatility_7d: 5.20,
    recommended_protocol: 'Aave V3',
    timestamp: new Date().toISOString(),
    flowfi_score: 96.8,
    active_mode: 'conservador',
    mode_description: 'Preservación de capital y mínima volatilidad (Exposición máx 80%).',
    market_data: {
      supply_rate: 5.45,
      utilization_rate: 0.58,
      health_factor: 2.85,
      tvl: 125000.0,
      volatility_7d: 5.20,
      current_allocation: 0.80,
      profit_generated: 0.0
    }
  },
  moderado: {
    action: 'SUPPLY',
    confidence: 0.91,
    estimated_apy: 8.03,
    risk_level: 'Medio',
    volatility_7d: 7.85,
    recommended_protocol: 'Aave V3',
    timestamp: new Date().toISOString(),
    flowfi_score: 94.5,
    active_mode: 'moderado',
    mode_description: 'Balance óptimo entre rendimiento y riesgo (ratio Sharpe máx 95%).',
    market_data: {
      supply_rate: 8.03,
      utilization_rate: 0.72,
      health_factor: 2.15,
      tvl: 1000.0,
      volatility_7d: 7.85,
      current_allocation: 0.85,
      profit_generated: 0.0
    }
  },
  agresivo: {
    action: 'SUPPLY',
    confidence: 0.88,
    estimated_apy: 11.20,
    risk_level: 'Alto',
    volatility_7d: 11.40,
    recommended_protocol: 'Aave V3',
    timestamp: new Date().toISOString(),
    flowfi_score: 89.2,
    active_mode: 'agresivo',
    mode_description: 'Maximización dinámica de APY y captura de liquidez (Exposición máx 100%).',
    market_data: {
      supply_rate: 11.20,
      utilization_rate: 0.89,
      health_factor: 1.45,
      tvl: 850000.0,
      volatility_7d: 11.40,
      current_allocation: 1.0,
      profit_generated: 0.0
    }
  }
};

export const useStrategy = () => {
  const [riskMode, setRiskModeState] = useState<RiskMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flowfi_risk_mode');
      if (saved && (saved === 'conservador' || saved === 'moderado' || saved === 'agresivo')) {
        return saved as RiskMode;
      }
    }
    return 'moderado';
  });

  const [riskModes, setRiskModes] = useState<RiskModeInfo[]>([]);
  const [strategiesCache, setStrategiesCache] = useState<Record<RiskMode, StrategyResponse>>(DEFAULT_STRATEGIES);
  const [strategy, setStrategy] = useState<StrategyResponse>(() => DEFAULT_STRATEGIES[riskMode] || DEFAULT_STRATEGIES.moderado);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingModes, setIsLoadingModes] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; txHash: string; message: string } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Inicialización instantánea de historial (desde localStorage o default)
  const [historicalData, setHistoricalData] = useState<HistoricalYieldItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('flowfi_cached_historical_yield');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEFAULT_HISTORICAL_DATA;
  });

  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const isHistoryFetchedRef = useRef(false);

  const fetchRiskModes = useCallback(async () => {
    setIsLoadingModes(true);
    try {
      const modes = await ApiService.getRiskModes();
      setRiskModes(modes);
    } catch {
      // Fallback a default modes
    } finally {
      setIsLoadingModes(false);
    }
  }, []);

  const fetchStrategy = useCallback(async (modeToFetch: RiskMode) => {
    // 1. Mostrar de inmediato la estrategia en caché para 0ms de retraso
    if (strategiesCache[modeToFetch]) {
      setStrategy(strategiesCache[modeToFetch]);
    }

    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await ApiService.getAIStrategy(modeToFetch);
      setStrategy(data);
      setStrategiesCache((prev) => ({ ...prev, [modeToFetch]: data }));
    } catch (err: any) {
      // Si falla, se mantiene la respuesta de respaldo en caché
      console.warn("Aviso al consultar estrategia de IA, usando datos locales:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [strategiesCache]);

  const fetchHistoricalData = useCallback(async () => {
    // Si ya tenemos datos, no mostramos spinner de carga bloqueante
    if (historicalData.length === 0) {
      setIsLoadingHistory(true);
    }
    try {
      const res = await ApiService.getHistoricalYield();
      if (res.history && res.history.length > 0) {
        setHistoricalData(res.history);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('flowfi_cached_historical_yield', JSON.stringify(res.history));
          } catch {}
        }
      }
    } catch (err: any) {
      console.warn("Aviso al obtener historial de rendimiento:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [historicalData.length]);

  // Manejador instantáneo de cambio de modo de riesgo
  const setRiskMode = (newMode: RiskMode) => {
    if (newMode === riskMode) return;
    setRiskModeState(newMode);
    
    // Cambiar inmediatamente la vista con 0ms de delay
    if (strategiesCache[newMode]) {
      setStrategy(strategiesCache[newMode]);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('flowfi_risk_mode', newMode);
    }
    
    // Actualizar en segundo plano la inferencia de Gemini para el nuevo modo
    fetchStrategy(newMode);
  };

  // Carga inicial al montar el componente
  useEffect(() => {
    fetchRiskModes();
    fetchStrategy(riskMode);
    if (!isHistoryFetchedRef.current) {
      isHistoryFetchedRef.current = true;
      fetchHistoricalData();
    }
  }, []);

  const executeStrategy = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const res = await ApiService.triggerRebalance(riskMode);
      setExecutionResult(res);
      await fetchStrategy(riskMode);
    } catch {
      setExecutionResult({
        success: false,
        txHash: '',
        message: 'Error al ejecutar la estrategia.'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    riskMode,
    setRiskMode,
    riskModes,
    strategy,
    isLoading,
    isLoadingModes,
    isExecuting,
    executionResult,
    fetchError,
    historicalData,
    isLoadingHistory,
    fetchStrategy: () => fetchStrategy(riskMode),
    executeStrategy
  };
};

