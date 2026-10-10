import time
from typing import Any

TTL_SECONDS = 600 
MAX_ENTRIES = 200  

_cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}


def check_cache(key: str) -> list[dict[str, Any]] | None:
    item = _cache.get(key)
    if item is None:
        return None
    stored_at, products = item
    if time.time() - stored_at > TTL_SECONDS:
        _cache.pop(key, None)
        return None
    return products


def set_cache(key: str, products: list[dict[str, Any]]) -> None:
    if len(_cache) >= MAX_ENTRIES:
        oldest = min(_cache, key=lambda k: _cache[k][0])
        _cache.pop(oldest, None)
    _cache[key] = (time.time(), products)