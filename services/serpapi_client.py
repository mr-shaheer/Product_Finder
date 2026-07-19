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
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()

        shopping_results = data.get("shopping_results", [])
        if not shopping_results:
            # Google didn't return a shopping panel for this query —
            # log the keys actually present so you can see what came back instead.
            print(f"[serpapi_search] no shopping_results. Top-level keys: {list(data.keys())}")
            return []

        results = []
        for item in shopping_results:
            try:
                price = item.get("extracted_price")
                if price is None:
                    # fallback: try to parse the raw price string if extracted_price is missing
                    raw_price = item.get("price", "")
                    price = float(
                        raw_price.replace("$", "").replace(",", "").split(" ")[0] or 0
                    )
                results.append({
                    "id": item.get("product_id", f"serp_{item.get('position', 0)}"),
                    "title": item.get("title", ""),
                    "price": float(price),
                    "url": item.get("product_link", item.get("link", "")),
                    "source": item.get("source", "unknown"),
                })
            except Exception as item_err:
                print(f"[serpapi_search] skipped item due to: {item_err}")
                continue

        return results

    except Exception as e:
        print(f"[serpapi_search] request failed: {e}")
        return []