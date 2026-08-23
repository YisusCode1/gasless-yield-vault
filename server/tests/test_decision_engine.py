from app.decision_engine import (
    calculate_rebalance_signal,
    get_risk_mode_info,
    get_all_risk_modes,
    RiskMode
)
from app.models import MarketData, StrategyRecommendation

def test_risk_modes_list():
    modes = get_all_risk_modes()
    assert len(modes) == 3
    mode_ids = [m.id for m in modes]
    assert "conservador" in mode_ids
    assert "moderado" in mode_ids
    assert "agresivo" in mode_ids

def test_conservador_exposure_limit():
    market_data = MarketData(
        supply_rate=5.5,
        utilization_rate=0.70,
        health_factor=1.50,
        tvl=100000.0,
        volatility_7d=4.0,
        current_allocation=0.50
    )
    rec = StrategyRecommendation(
        action="SUPPLY",
        confidence=0.9,
        estimated_apy=6.0,
        risk_level="Bajo",
        flowfi_score=95.0
    )

    signal = calculate_rebalance_signal("conservador", market_data, rec)
    # Conservador tiene max exposure 0.60. current_alloc (0.50) + 0.15 = 0.65 -> clamped to 0.60
    assert signal.target_allocation == 0.60
    # diff = (0.60 - 0.50) * 100000 = 10000 USD -> 10000000000 micro-units
    assert signal.amount_to_supply > 0
    assert signal.amount_to_withdraw == 0

def test_high_utilization_reduction():
    market_data = MarketData(
        supply_rate=12.0,
        utilization_rate=0.95,  # Alta utilizacion > 0.85/0.90
        health_factor=1.20,
        tvl=100000.0,
        volatility_7d=15.0,
        current_allocation=0.80
    )
    rec = StrategyRecommendation(
        action="HOLD",
        confidence=0.8,
        estimated_apy=10.0,
        risk_level="Medio",
        flowfi_score=80.0
    )

    signal = calculate_rebalance_signal("moderado", market_data, rec)
    # Al estar U > 0.90 en moderado, target_allocation se reduce a max_exposure(0.80) * reduction_factor(0.75) = 0.60
    assert signal.target_allocation == 0.60
    assert signal.amount_to_withdraw > 0
