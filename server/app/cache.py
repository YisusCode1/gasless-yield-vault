import time
from typing import Any, Optional, Dict

class TTLCache:
    def __init__(self, default_ttl: int = 60):
        self.default_ttl = default_ttl
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        self._purge_expired()
        item = self._cache.get(key)
        if item and time.time() < item["expires_at"]:
            return item["value"]
        elif item:
            del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        self._purge_expired()
        duration = ttl if ttl is not None else self.default_ttl
        self._cache[key] = {
            "value": value,
            "expires_at": time.time() + duration,
            "created_at": time.time()
        }

    def invalidate(self, key: str) -> None:
        self._cache.pop(key, None)

    def clear(self) -> None:
        self._cache.clear()

    def size(self) -> int:
        self._purge_expired()
        return len(self._cache)

    def _purge_expired(self) -> None:
        now = time.time()
        expired_keys = [k for k, v in self._cache.items() if now >= v["expires_at"]]
        for k in expired_keys:
            del self._cache[k]
