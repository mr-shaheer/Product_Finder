from typing import Any
import httpx
import os


def serpapi_search(query: str, category: str) -> list[dict[str, Any]]:
    api_key = os.environ.get("SERPAPI_KEY")
    if not api_key:
        return []

    # Separate connect vs read timeout, and retry once on a timeout before
    # giving up and falling back to placeholder data — a single slow response
    # shouldn't throw away the whole live search.
    timeout = httpx.Timeout(connect=5.0, read=25.0, write=10.0, pool=5.0)
    last_error: Exception | None = None

    for attempt in range(2):
        try:
            resp = httpx.get(
                "https://serpapi.com/search",
                params={"q": query, "api_key": api_key, "engine": "google_shopping"},
                timeout=timeout,
            )
            resp.raise_for_status()
            data = resp.json()
            break
        except httpx.TimeoutException as e:
            last_error = e
            print(f"[serpapi_search] attempt {attempt + 1} timed out, "
                  f"{'retrying' if attempt == 0 else 'giving up'}")
            continue
        except Exception as e:
            print(f"[serpapi_search] request failed: {e}")
            return []
    else:
        print(f"[serpapi_search] request failed after retry: {last_error}")
        return []

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
            old_price = None
            raw_old_price = item.get("extracted_old_price")
            if raw_old_price is not None:
                old_price = float(raw_old_price)
            else:
                raw_old_price_str = item.get("old_price")
                if raw_old_price_str:
                    try:
                        old_price = float(
                            str(raw_old_price_str).replace("$", "").replace(",", "").split(" ")[0]
                        )
                    except ValueError:
                        old_price = None

            results.append({
                "id": item.get("product_id", f"serp_{item.get('position', 0)}"),
                "title": item.get("title", ""),
                "price": float(price),
                "old_price": old_price,
                "rating": item.get("rating"),
                "reviews_count": item.get("reviews"),
                "url": item.get("product_link", item.get("link", "")),
                "source": item.get("source", "unknown"),
                "image_url": item.get("thumbnail") or item.get("serpapi_thumbnail")
            })
        except Exception as item_err:
            print(f"[serpapi_search] skipped item due to: {item_err}")
            continue

    return results