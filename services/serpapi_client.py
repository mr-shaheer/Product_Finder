from typing import Any
import httpx
import os


def serpapi_search(query: str, category: str) -> list[dict[str, Any]]:
    api_key = os.environ.get("SERPAPI_KEY")
    if not api_key:
        return []
    try:
        resp = httpx.get(
            "https://serpapi.com/search",
            params={"q": query, "api_key": api_key, "engine": "google_shopping"},
            timeout=10,
        )
        resp.raise_for_status()
        results = []
        for item in resp.json().get("shopping_results", []):
            results.append({
                "id": item.get("product_id", f"serp_{item.get('position', 0)}"),
                "title": item.get("title", ""),
                "price": float(item.get("price", "0").replace("$", "").replace(",", "")),
                "url": item.get("link", ""),
                "source": "serpapi",
            })
        return results
    except Exception:
        return []