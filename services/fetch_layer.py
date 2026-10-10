from typing import Any
from services.cache import check_cache, set_cache
from services.fallback_data import fallback
from services.request_context import serpapi_key_var
from services.serpapi_client import serpapi_search


def fetch_products(category: str, query: str) -> list[dict[str, Any]]:
    # No SerpApi key for this request -> sample data (never cached).
    if not serpapi_key_var.get():
        return fallback(category, query)

    cache_key = f"{category}:{query.lower().strip()}"
    cached = check_cache(cache_key)
    if cached:
        return cached

    results = serpapi_search(query, category)
    if results:
        set_cache(cache_key, results)  # only real results are cached
        return results

    return fallback(category, query)