from typing import Any
from services.cache import check_cache, set_cache
from services.fallback_data import fallback
from services.serpapi_client import serpapi_search


def fetch_products(category: str, query: str) -> list[dict[str, Any]]:
    cache_key = f"{category}:{query.lower().strip()}"
    cached = check_cache(cache_key)
    if cached:
        return cached
    results = serpapi_search(query, category)
    if not results:
        results = fallback(category, query)
    set_cache(cache_key, results)
    return results