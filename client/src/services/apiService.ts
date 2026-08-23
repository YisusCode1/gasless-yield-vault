import { StrategyResponse, RebalanceSignalResponse, RiskMode, RiskModeInfo, HistoricalYieldResponse } from '../types';

const API_BASE_URL = '/api/v1';

export class ApiService {
  public static async getRiskModes(): Promise<RiskModeInfo[]> {
    const response = await fetch(`${API_BASE_URL}/risk-modes`);
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: No se pudieron obtener los modos de riesgo.`);
    }
    return await response.json();
  }

  public static async getAIStrategy(mode: RiskMode = 'moderado'): Promise<StrategyResponse> {
    const response = await fetch(`${API_BASE_URL}/strategy?mode=${mode}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Error HTTP ${response.status}: No se pudo obtener la estrategia de IA.`);
    }
    const data: StrategyResponse = await response.json();
    return data;
  }

  public static async triggerRebalance(mode: RiskMode = 'moderado'): Promise<RebalanceSignalResponse> {
    const response = await fetch(`${API_BASE_URL}/rebalance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Error HTTP ${response.status}: No se pudo generar la señal de rebalanceo.`);
    }
    return await response.json();
  }

  public static async getHistoricalYield(): Promise<HistoricalYieldResponse> {
    const response = await fetch(`${API_BASE_URL}/historical-yield`);
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: No se pudo obtener el historial de rendimiento.`);
    }
    return await response.json();
  }
}
