from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import datetime
import logging
from typing import Optional

from app.config import settings
from app.models import (
    StrategyResponse,
    RebalanceRequest,
    RebalanceResponse,
    FlowFiMetrics,
    RiskModeInfo,
    AgentStatus,
    MarketData
)
from app.agent import GeminiAgent
from app.decision_engine import (
    get_all_risk_modes,
    get_risk_mode_info,
    calculate_rebalance_signal,
    normalize_mode
)
from app.signer import sign_eip712_rebalance_signal
from app.market_data import fetch_market_data, fetch_defillama_historical_data

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("FlowFiAPI")

app = FastAPI(
    title="FlowFi AI & DeFi Engine - Gasless Yield Vault on Arbitrum",
    description="Backend de Inteligencia Artificial y API REST para Vault DeFi ERC-4626 Gasless en Arbitrum Sepolia",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instancia global del agente IA
agent = GeminiAgent()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "FlowFi AI & DeFi Backend",
        "version": "2.0.0",
        "ai_agent_address": settings.AI_AGENT_ADDRESS
    }

@app.get("/api/v1/health")
def get_health():
    return {
        "status": "ok",
        "gemini_configured": bool(settings.GEMINI_API_KEYS),
        "gemini_keys_pool_size": len(settings.GEMINI_API_KEYS),
        "gemini_active_key_index": agent.current_key_index + 1 if agent.api_keys else 0,
        "model": settings.GEMINI_MODEL,
        "ai_agent_address": settings.AI_AGENT_ADDRESS,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get("/api/v1/agent/status", response_model=AgentStatus)
def get_agent_status():
    return AgentStatus(
        is_healthy=True,
        last_call_timestamp=agent.last_call_timestamp,
        cache_size=agent.cache.size(),
        model=settings.GEMINI_MODEL
    )

@app.get("/api/v1/risk-modes", response_model=list[RiskModeInfo])
def get_risk_modes():
    """Retorna los modos de riesgo configurables para el Agente IA."""
    return get_all_risk_modes()

@app.get("/api/v1/strategy", response_model=StrategyResponse)
async def get_current_strategy(
    mode: str = Query("moderado", description="Modo de riesgo: conservador, moderado, o agresivo")
):
    enum_mode = normalize_mode(mode)
    mode_info = get_risk_mode_info(enum_mode.value)
    try:
        market_data = fetch_market_data()
        recommendation = await agent.get_strategy(enum_mode.value, market_data)
        return StrategyResponse(
            action=recommendation.action,
            confidence=recommendation.confidence,
            estimated_apy=recommendation.estimated_apy,
            risk_level=recommendation.risk_level,
            volatility_7d=market_data.volatility_7d,
            recommended_protocol="Aave V3",
            timestamp=datetime.datetime.utcnow().isoformat(),
            flowfi_score=recommendation.flowfi_score,
            active_mode=mode_info.id,
            mode_description=mode_info.description,
            market_data=market_data
        )
    except Exception as e:
        logger.error(f"Error al procesar estrategia: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/rebalance", response_model=RebalanceResponse)
async def execute_rebalance(payload: Optional[RebalanceRequest] = None):
    req = payload or RebalanceRequest()
    enum_mode = normalize_mode(req.mode or "moderado")
    vault_addr = req.vault_address or settings.VAULT_CONTRACT_ADDRESS
    try:
        market_data = fetch_market_data(vault_addr)
        recommendation = await agent.get_strategy(enum_mode.value, market_data)
        signal = calculate_rebalance_signal(enum_mode.value, market_data, recommendation)

        # Generar firma EIP-712 REAL con la clave privada del Agente IA
        signature = sign_eip712_rebalance_signal(
            amount_to_supply=signal.amount_to_supply,
            amount_to_withdraw=signal.amount_to_withdraw,
            profit_generated=signal.profit_generated,
            nonce=signal.nonce,
            deadline=signal.deadline,
            vault_address=vault_addr
        )

        return RebalanceResponse(
            success=True,
            txHash="",
            message=f"Firma EIP-712 legítima del Agente IA ({settings.AI_AGENT_ADDRESS[:6]}...{settings.AI_AGENT_ADDRESS[-4:]}) generada para el modo {enum_mode.value.capitalize()}.",
            timestamp=datetime.datetime.utcnow().isoformat(),
            amountToSupply=signal.amount_to_supply,
            amountToWithdraw=signal.amount_to_withdraw,
            profitGenerated=signal.profit_generated,
            nonce=signal.nonce,
            deadline=signal.deadline,
            signature=signature,
            target_allocation=signal.target_allocation,
            confidence=signal.confidence
        )
    except Exception as e:
        logger.error(f"Error al ejecutar rebalanceo: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno al calcular la señal de rebalanceo: {str(e)}")

@app.get("/api/v1/historical-yield")
async def get_historical_yield():
    data = await fetch_defillama_historical_data()
    if not data:
        raise HTTPException(status_code=500, detail="No se pudo obtener el historial de rendimiento")
    return {
        "status": "success",
        "source": "DefiLlama Indexer",
        "protocol": "Aave V3",
        "chain": "Arbitrum",
        "count": len(data),
        "history": data
    }

@app.get("/api/v1/flowfi", response_model=FlowFiMetrics)
def get_flowfi_metrics():
    return FlowFiMetrics(
        ecosystem="Arbitrum Sepolia",
        active_vaults=1,
        total_volume_usd=0.0,
        health_score=98.2,
        arbitrum_network_status="Optimal"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
