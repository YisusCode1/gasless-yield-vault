import os


env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_path):
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip())
    except Exception:
        pass

class Settings:
    def __init__(self):
        # Pool de API keys para rotación (separadas por comas en .env)
        keys_env = os.getenv("GEMINI_API_KEYS", "")
        self.GEMINI_API_KEYS = [k.strip() for k in keys_env.split(",") if k.strip()]

        # Retrocompatibilidad: si no hay pool, usar la clave singular antigua
        if not self.GEMINI_API_KEYS:
            single_key = os.getenv("GEMINI_API_KEY", "")
            if single_key:
                self.GEMINI_API_KEYS = [single_key]

        # Propiedad legacy para código que aún lea GEMINI_API_KEY
        self.GEMINI_API_KEY = self.GEMINI_API_KEYS[0] if self.GEMINI_API_KEYS else ""

        self.GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.GEMINI_TIMEOUT = int(os.getenv("GEMINI_TIMEOUT", "10"))
        self.GEMINI_MAX_RETRIES = int(os.getenv("GEMINI_MAX_RETRIES", "2"))
        self.CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "60"))

        # Configuración Web3 / EIP-712
        # Carga estricta desde el archivo .env (sin valores fallback con errores de formato)
        self.AI_AGENT_ADDRESS = os.getenv("AI_AGENT_ADDRESS", "")
        self.AI_AGENT_PRIVATE_KEY = os.getenv("AI_AGENT_PRIVATE_KEY", "")
        self.VAULT_CONTRACT_ADDRESS = os.getenv("VAULT_CONTRACT_ADDRESS", "")
        self.CHAIN_ID = int(os.getenv("CHAIN_ID", "421614"))

        # Validación preventiva para el desarrollador
        if not self.AI_AGENT_PRIVATE_KEY:
            print(" ADVERTENCIA: AI_AGENT_PRIVATE_KEY no está configurada en el archivo .env")

settings = Settings()
