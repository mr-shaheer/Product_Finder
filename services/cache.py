from typing import Any

_cache: dict[str, list[dict[str, Any]]] = {}


def check_cache(key: str) -> list[dict[str, Any]] | None:
    return _cache.get(key)


def set_cache(key: str, products: list[dict[str, Any]]) -> None:
    _cache[key] = products