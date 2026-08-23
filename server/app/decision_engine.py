import time
from enum import Enum
from dataclasses import dataclass
from typing import List
from app.models import MarketData, StrategyRecommendation, RebalanceSignal, RiskModeInfo

class RiskMode(str, Enum):
    CONSERVADOR = "conservador"
    MODERADO = "moderado"
    AGRESIVO = "agresivo"

@dataclass
class RiskConfig:
    name: str
    max_exposure: float          # 0-1 (fraccion maxima en Aave)
    min_health_factor: float     # HF minimo tolerado
    utilization_threshold: float # % de utilizacion que dispara reduccion (0-1)
    reduction_factor: float      # Cuanto reducir al superar umbral
    rebalance_cooldown_hours: int
    description: str
    risk_level_label: str
    color: str

RISK_CONFIGS = {
    RiskMode.CONSERVADOR: RiskConfig(
        name="Conservador",
        max_exposure=0.60,
        min_health_factor=1.30,
        utilization_threshold=0.85,
        reduction_factor=0.666,  # reduce exposicion a ~40%
        rebalance_cooldown_hours=24,
        description="Preserva capital, minima volatilidad y baja exposicion.",
        risk_level_label="Bajo",
        color="emerald"
    ),
    RiskMode.MODERADO: RiskConfig(
        name="Moderado",
        max_exposure=0.80,
        min_health_factor=1.15,
        utilization_threshold=0.90,
        reduction_factor=0.75,   # reduce exposicion a ~60%
        rebalance_cooldown_hours=8,
        description="Balance optimo entre rendimiento y riesgo (ratio Sharpe).",
        risk_level_label="Medio",
        color="cyan"
    ),
    RiskMode.AGRESIVO: RiskConfig(
        name="Agresivo",
        max_exposure=0.95,
        min_health_factor=1.05,
        utilization_threshold=0.92,
        reduction_factor=0.736,  # reduce exposicion a ~70%
        rebalance_cooldown_hours=2,
        description="Maximo rendimiento buscando capturar todo el yield disponible.",
        risk_level_label="Alto",
        color="amber"
    ),
}

def normalize_mode(mode_str: str) -> RiskMode:
    clean = (mode_str or "moderado").lower().strip()
    if clean in ["conservador", "guardian"]:
        return RiskMode.CONSERVADOR
    elif clean in ["agresivo", "maximizer"]:
        return RiskMode.AGRESIVO
    return RiskMode.MODERADO

def calculate_rebalance_signal(
    mode: str,
    market_data: MarketData,
    recommendation: StrategyRecommendation
) -> RebalanceSignal:
    enum_mode = normalize_mode(mode)
    config = RISK_CONFIGS[enum_mode]

    current_alloc = market_data.current_allocation

    if recommendation.action == "SUPPLY":
        target_allocation = min(config.max_exposure, current_alloc + 0.15)
    elif recommendation.action == "WITHDRAW":
        target_allocation = max(0.10, current_alloc - 0.15)
    else:  # HOLD
        target_allocation = current_alloc

    # Restriccion por utilizacion de Aave
    if market_data.utilization_rate > config.utilization_threshold:
        target_allocation = min(target_allocation, config.max_exposure * config.reduction_factor)

    # Restriccion por Health Factor (emergencia)
    if market_data.health_factor < config.min_health_factor:
        target_allocation = max(0.10, target_allocation - 0.30)

    # Asegurar rango [0, max_exposure]
    target_allocation = max(0.0, min(config.max_exposure, round(target_allocation, 4)))

    tvl = market_data.tvl
    current_supplied = current_alloc * tvl
    target_supplied = target_allocation * tvl

    diff = target_supplied - current_supplied
    # Convertir a 6 decimales USDC
    if diff > 0:
        amount_to_supply = int(diff * 1e6)
        amount_to_withdraw = 0
    else:
        amount_to_supply = 0
        amount_to_withdraw = int(abs(diff) * 1e6)

    profit_gen = int((market_data.profit_generated or 0.0) * 1e6)
    now = int(time.time())

    return RebalanceSignal(
        amount_to_supply=amount_to_supply,
        amount_to_withdraw=amount_to_withdraw,
        profit_generated=profit_gen,
        nonce=now,
        deadline=now + 3600,
        target_allocation=target_allocation,
        confidence=recommendation.confidence
    )

def get_risk_mode_info(mode: str) -> RiskModeInfo:
    enum_mode = normalize_mode(mode)
    cfg = RISK_CONFIGS[enum_mode]
    return RiskModeInfo(
        id=enum_mode.value,
        name=cfg.name,
        description=cfg.description,
        max_exposure=cfg.max_exposure,
        risk_level=cfg.risk_level_label,
        color=cfg.color,
        cooldown_hours=cfg.rebalance_cooldown_hours
    )

def get_all_risk_modes() -> List[RiskModeInfo]:
    return [get_risk_mode_info(m.value) for m in RiskMode]
