from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal

class MarketData(BaseModel):
    supply_rate: float = Field(..., description="Tasa de suministro Aave (%)")
    utilization_rate: float = Field(..., description="Tasa de utilizacion Aave (0-1)")
    health_factor: float = Field(..., description="Health Factor del Vault")
    tvl: float = Field(..., description="TVL total en USD")
    volatility_7d: float = Field(..., description="Volatilidad 7 dias (%)")
    current_allocation: float = Field(..., description="Asignacion actual en Aave (0-1)")
    profit_generated: Optional[float] = Field(0.0, description="Ganancias generadas en USD")

class StrategyRecommendation(BaseModel):
    action: Literal["HOLD", "SUPPLY", "WITHDRAW"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    estimated_apy: float = Field(..., ge=0.0)
    risk_level: str
    flowfi_score: float = Field(94.5, ge=0.0, le=100.0)

    @field_validator("confidence")
    @classmethod
    def check_confidence(cls, v: float) -> float:
        return round(v, 2)

class RiskModeInfo(BaseModel):
    id: str
    name: str
    description: str
    max_exposure: float
    risk_level: str
    color: str
    cooldown_hours: int

class StrategyResponse(BaseModel):
    action: str
    confidence: float
    estimated_apy: float
    risk_level: str
    volatility_7d: float
    recommended_protocol: str
    timestamp: str
    flowfi_score: float = 94.5
    active_mode: str
    mode_description: str
    market_data: Optional[MarketData] = None

class RebalanceRequest(BaseModel):
    vault_address: Optional[str] = None
    target_protocol: Optional[str] = "Aave V3"
    mode: Optional[str] = "moderado"

class RebalanceResponse(BaseModel):
    success: bool
    txHash: str
    message: str
    timestamp: str
    amountToSupply: int
    amountToWithdraw: int
    profitGenerated: int
    nonce: int
    deadline: int
    signature: str
    target_allocation: Optional[float] = None
    confidence: Optional[float] = None

class RebalanceSignal(BaseModel):
    amount_to_supply: int
    amount_to_withdraw: int
    profit_generated: int
    nonce: int
    deadline: int
    target_allocation: float
    confidence: float

class AgentStatus(BaseModel):
    is_healthy: bool
    last_call_timestamp: Optional[str] = None
    cache_size: int
    model: str

class FlowFiMetrics(BaseModel):
    ecosystem: str
    active_vaults: int
    total_volume_usd: float
    health_score: float
    arbitrum_network_status: str
