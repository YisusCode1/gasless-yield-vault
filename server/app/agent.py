import logging
import json
import time
from typing import Dict, Any, Optional
from app.config import settings
from app.models import MarketData, StrategyRecommendation
from app.cache import TTLCache
from app.decision_engine import normalize_mode, RiskMode

logger = logging.getLogger(__name__)

# Intentar importar google-genai o google.generativeai
try:
    from google import genai
    from google.genai import types
    HAS_GENAI_NEW = True
except ImportError:
    HAS_GENAI_NEW = False
    try:
        import google.generativeai as genai_old
        HAS_GENAI_OLD = True
    except ImportError:
        HAS_GENAI_OLD = False

class GeminiAgent:
    def __init__(self):
        self.model = settings.GEMINI_MODEL
        self.cache = TTLCache(default_ttl=settings.CACHE_TTL_SECONDS)
        self.last_call_timestamp: Optional[str] = None

        # --- POOL DE API KEYS CON ROTACIÓN ---
        self.api_keys = settings.GEMINI_API_KEYS
        if not self.api_keys:
            logger.critical("CRÍTICO: No se encontraron claves API en GEMINI_API_KEYS ni GEMINI_API_KEY")
        self.current_key_index = 0
        self.client = None

        # Inicializar el cliente con la primera clave disponible
        if self.api_keys and HAS_GENAI_NEW:
            try:
                self.client = genai.Client(api_key=self.api_keys[0])
                logger.info(f"Pool de {len(self.api_keys)} claves API cargada. Usando clave #1.")
            except Exception as e:
                logger.warning(f"Error al inicializar google.genai client con clave #1: {e}")

    def _rotate_key(self) -> bool:
        """
        Avanza al siguiente API key de la pool de forma cíclica.
        Retorna True si pudo rotar, False si ya recorrió todas las claves.
        """
        if len(self.api_keys) <= 1:
            return False

        old_index = self.current_key_index
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        logger.info(f"🔄 Rotando API key: #{old_index + 1} → #{self.current_key_index + 1} de {len(self.api_keys)}")

        # Reinstanciar el cliente con la nueva clave
        if HAS_GENAI_NEW:
            try:
                self.client = genai.Client(api_key=self.api_keys[self.current_key_index])
                return True
            except Exception as e:
                logger.error(f"Error al instanciar cliente con clave #{self.current_key_index + 1}: {e}")
                return False
        return True

    def _get_active_key(self) -> str:
        """Retorna la API key actualmente activa."""
        if self.api_keys:
            return self.api_keys[self.current_key_index]
        return ""

    async def get_strategy(self, mode_str: str, market_data: MarketData) -> StrategyRecommendation:
        enum_mode = normalize_mode(mode_str)
        cache_key = f"{enum_mode.value}:{market_data.supply_rate}:{market_data.utilization_rate}:{market_data.health_factor}:{market_data.current_allocation}"

        cached = self.cache.get(cache_key)
        if cached:
            logger.info(f"Retornando respuesta de cache para clave {cache_key}")
            return StrategyRecommendation(**cached)

        system_prompt = self._build_system_prompt(enum_mode)
        user_prompt = self._build_user_prompt(market_data)

        raw_data = await self._call_gemini_with_rotation(system_prompt, user_prompt)
        
        if raw_data:
            try:
                rec = StrategyRecommendation(**raw_data)
                self.cache.set(cache_key, rec.model_dump() if hasattr(rec, 'model_dump') else rec.dict())
                self.last_call_timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                return rec
            except Exception as ve:
                logger.error(f"Error de validacion en respuesta Gemini: {ve}")

        # Fallback elegante si Gemini falla o no responde
        logger.warning(f"Usando estrategia fallback para modo {enum_mode.value}")
        fallback_rec = self._get_fallback_recommendation(enum_mode, market_data)
        
        # Cachear el fallback temporalmente para evitar la espiral de requests (death spiral) en caso de limitacion de cuota (429)
        self.cache.set(cache_key, fallback_rec.model_dump() if hasattr(fallback_rec, 'model_dump') else fallback_rec.dict())
        return fallback_rec

    async def _call_gemini_with_rotation(self, system_prompt: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        """
        Intenta llamar a Gemini con la clave actual. Si recibe un error 429
        (cuota agotada), rota automáticamente a la siguiente clave de la pool.
        Recorre todas las claves disponibles antes de rendirse.
        """
        max_attempts = len(self.api_keys) if self.api_keys else 1
        retries_per_key = settings.GEMINI_MAX_RETRIES

        for key_attempt in range(max_attempts):
            active_key = self._get_active_key()
            if not active_key:
                logger.warning("SDK de Gemini no disponible o API keys no configuradas.")
                return None

            # Reintentos internos por clave (para errores transitorios, no 429)
            for retry in range(retries_per_key + 1):
                try:
                    result = await self._execute_gemini_call(system_prompt, user_prompt, active_key)
                    if result is not None:
                        return result
                except Exception as e:
                    error_str = str(e)
                    logger.error(
                        f"Clave #{self.current_key_index + 1}, intento {retry + 1}/{retries_per_key + 1}: {error_str}"
                    )

                    # --- DETECCIÓN DE CUOTA AGOTADA O PERMISOS DENEGADOS (429, 403, 404) ---
                    if any(code in error_str for code in ["429", "403", "404"]) or "RESOURCE_EXHAUSTED" in error_str.upper():
                        logger.warning(
                            f"⚠️ Cuota/Modelo no disponible en clave #{self.current_key_index + 1}. "
                            f"Intentando rotación ({key_attempt + 1}/{max_attempts})..."
                        )
                        # No reintentar con la misma clave, saltar al siguiente key_attempt
                        break

                    # Para otros errores, reintentar con backoff exponencial
                    if retry < retries_per_key:
                        import asyncio
                        wait_time = 1.0 * (retry + 1)
                        logger.info(f"Reintentando en {wait_time}s...")
                        await asyncio.sleep(wait_time)
                    else:
                        # Agotamos reintentos con esta clave por error no-429
                        logger.error(f"Agotados reintentos para clave #{self.current_key_index + 1}. Intentando rotación...")
                        break

            # Si llegamos aquí, la clave actual falló. Intentar rotar.
            if key_attempt < max_attempts - 1:
                if not self._rotate_key():
                    logger.error("No se pudo rotar a la siguiente clave.")
                    break
            else:
                logger.error(
                    f"🚨 Todas las {max_attempts} claves API de la pool fallaron. "
                    "Activando fallback HOLD."
                )

        return None

    async def _execute_gemini_call(self, system_prompt: str, user_prompt: str, api_key: str) -> Optional[Dict[str, Any]]:
        """Ejecuta la llamada real a Gemini. Lanza excepciones para que el caller las maneje."""
        if self.client and HAS_GENAI_NEW:
            response = self.client.models.generate_content(
                model=self.model,
                contents=f"{system_prompt}\n\n{user_prompt}",
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=1024,
                    response_mime_type="application/json"
                )
            )
            text = response.text
        elif HAS_GENAI_OLD and api_key:
            genai_old.configure(api_key=api_key)
            model_obj = genai_old.GenerativeModel(
                self.model,
                generation_config={"response_mime_type": "application/json", "temperature": 0.2}
            )
            res = model_obj.generate_content(f"{system_prompt}\n\n{user_prompt}")
            text = res.text
        else:
            logger.warning("SDK de Gemini no disponible o API key no configurada.")
            return None

        # Limpiar la respuesta antes de procesarla
        texto_crudo = text
        # Quitar las etiquetas de markdown si la IA las pone
        clean_text = texto_crudo.replace("```json", "").replace("```", "").strip()
        
        # Asegurar que extraemos solo el bloque JSON por si Gemini añade texto adicional
        start_idx = clean_text.find('{')
        end_idx = clean_text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            clean_text = clean_text[start_idx:end_idx+1]

        return json.loads(clean_text)

    def _build_system_prompt(self, mode: RiskMode) -> str:
        base_instructions = """
        Eres un agente de Inteligencia Artificial especializado en optimizacion de vaults DeFi ERC-4626 en Arbitrum Sepolia.
        Tu funcion es analizar metricas financieras de Aave V3 y recomendar la accion del vault.
        
        Reglas estrictas para los valores:
        - action: Debe ser exactamente "HOLD", "SUPPLY" o "WITHDRAW".
        - confidence: Float entre 0.0 y 1.0.
        - estimated_apy: Float mayor o igual a 0.0.
        - risk_level: Debe ser exactamente "Bajo", "Medio" o "Alto".
        - flowfi_score: Float entre 0.0 y 100.0.
        
        DEBES responder UNICAMENTE con un objeto JSON valido. SIN texto adicional. SIN comentarios.
        Ejemplo de respuesta valida:
        {"action": "HOLD", "confidence": 0.92, "estimated_apy": 5.74, "risk_level": "Bajo", "flowfi_score": 94.5}
        """

        mode_prompts = {
            RiskMode.CONSERVADOR: """
            MODO DE RIESGO: CONSERVADOR
            Tu prioridad absoluta es la preservacion del capital y minimizar cualquier posibilidad de perdidas o liquidez atrapada.
            - Si la tasa de utilizacion de Aave supera el 80% o la volatilidad es alta (>10%), recomienda WITHDRAW o HOLD.
            - Solo recomienda SUPPLY si la confianza es superior al 0.90 y el Health Factor es > 1.30.
            - Nivel de riesgo sugerido en JSON: "Bajo".
            """,
            RiskMode.MODERADO: """
            MODO DE RIESGO: MODERADO
            Tu objetivo es equilibrar la rentabilidad (APY) y la seguridad de la posicion (ratio de Sharpe).
            - Recomienda SUPPLY cuando las tasas de interes sean atractivas y el mercado este estable.
            - Recomienda WITHDRAW o HOLD si la utilizacion supera el 90% o el Health Factor cae de 1.15.
            - Nivel de riesgo sugerido en JSON: "Medio".
            """,
            RiskMode.AGRESIVO: """
            MODO DE RIESGO: AGRESIVO
            Tu objetivo es maximizar el rendimiento (APY) aprovechando picos de rendimiento en Aave V3.
            - Recomienda SUPPLY agresivamente para mantener la maxima cantidad de fondos invertidos generandoyield.
            - Solo recomienda WITHDRAW si el Health Factor cae peligrosamente por debajo de 1.05.
            - Nivel de riesgo sugerido en JSON: "Alto".
            """
        }
        return base_instructions + "\n" + mode_prompts.get(mode, mode_prompts[RiskMode.MODERADO])

    def _build_user_prompt(self, data: MarketData) -> str:
        return f"""
        Datos de mercado actuales para el Vault:
        - Tasa de suministro Aave V3: {data.supply_rate}%
        - Tasa de utilizacion del pool: {data.utilization_rate * 100:.1f}%
        - Health Factor del Vault: {data.health_factor}
        - TVL total en Vault: ${data.tvl:,.2f} USD
        - Volatilidad a 7 dias: {data.volatility_7d}%
        - Asignacion actual en Aave: {data.current_allocation * 100:.1f}%
        """

    def _get_fallback_recommendation(self, mode: RiskMode, data: MarketData) -> StrategyRecommendation:
        if mode == RiskMode.CONSERVADOR:
            return StrategyRecommendation(
                action="HOLD",
                confidence=0.88,
                estimated_apy=max(4.2, data.supply_rate),
                risk_level="Bajo",
                flowfi_score=95.0
            )
        elif mode == RiskMode.AGRESIVO:
            return StrategyRecommendation(
                action="SUPPLY",
                confidence=0.82,
                estimated_apy=max(7.5, data.supply_rate * 1.3),
                risk_level="Alto",
                flowfi_score=88.5
            )
        else:
            return StrategyRecommendation(
                action="HOLD",
                confidence=0.90,
                estimated_apy=max(5.74, data.supply_rate),
                risk_level="Medio",
                flowfi_score=94.5
            )
