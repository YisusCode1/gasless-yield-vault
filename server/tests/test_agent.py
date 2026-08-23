import asyncio
from unittest.mock import AsyncMock, patch
from app.agent import GeminiAgent
from app.models import MarketData, StrategyRecommendation

def test_agent_fallback_recommendation():
    async def run():
        agent = GeminiAgent()
        market_data = MarketData(
            supply_rate=5.5,
            utilization_rate=0.75,
            health_factor=1.25,
            tvl=125446.51,
            volatility_7d=7.85,
            current_allocation=0.80
        )
        
        with patch.object(agent, '_call_gemini_with_rotation', new_callable=AsyncMock) as mock_gemini:
            mock_gemini.return_value = None  # Simula fallo en Gemini
            rec = await agent.get_strategy("conservador", market_data)
            assert isinstance(rec, StrategyRecommendation)
            assert rec.risk_level == "Bajo"
            assert rec.action == "HOLD"
    
    asyncio.run(run())

def test_agent_valid_response():
    async def run():
        agent = GeminiAgent()
        market_data = MarketData(
            supply_rate=5.5,
            utilization_rate=0.75,
            health_factor=1.25,
            tvl=125446.51,
            volatility_7d=7.85,
            current_allocation=0.80
        )

        valid_json = {
            "action": "SUPPLY",
            "confidence": 0.95,
            "estimated_apy": 8.5,
            "risk_level": "Alto",
            "flowfi_score": 90.0
        }

        with patch.object(agent, '_call_gemini_with_rotation', new_callable=AsyncMock) as mock_gemini:
            mock_gemini.return_value = valid_json
            rec = await agent.get_strategy("agresivo", market_data)
            assert rec.action == "SUPPLY"
            assert rec.confidence == 0.95
            assert rec.estimated_apy == 8.5
            
    asyncio.run(run())
