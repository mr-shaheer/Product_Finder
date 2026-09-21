import re   
import statistics
from agents import function_tool
from schema import Product, ProductCategory, ScoredProduct
from services.fetch_layer import fetch_products

TRUSTED_RETAILERS = {
    "amazon.com", "walmart", "walmart.com", "best buy", "bestbuy.com",
    "samsung", "samsung.com", "target", "target.com", "costco",
    "b&h photo video", "newegg", "newegg.com",
}

def extract_budget(query: str) -> float | None:
    """Detect an explicit max price the user mentioned, e.g. 'under $100', 'below 100'."""
    match = re.search(r'(?:under|below|less than|max|up to)\s*\$?(\d+)', query.lower())
    return float(match.group(1)) if match else None

def is_trusted(source: str) -> bool:
    return source.strip().lower() in TRUSTED_RETAILERS

@function_tool
def normalize_and_score_products(
    category: ProductCategory, query: str, budget_cap: float | None = None
) -> list[ScoredProduct]:
    """Score and filter products for a given category and query.

    Re-fetches the same products `search_products` just found (this hits the fetch-layer
    cache, so it's free) instead of taking them as an argument. Product data must never be
    round-tripped through the model as a tool argument — asked to retype a whole product list
    to hand it to this tool, the model reliably keeps required fields like title/price/url but
    silently drops or nulls optional ones (image_url in particular) since nothing here reads
    them for scoring, so it doesn't preserve them faithfully. Re-deriving the list in Python
    guarantees every field, including images, survives intact.

    budget_cap: an explicit max price the caller has already parsed out of the user's
    request (e.g. 100.0 for "under $100"). Pass this whenever the user stated a budget —
    it's used directly instead of relying on regex-detecting the phrase back out of `query`,
    which is fragile if `query` gets reworded or shortened before it gets here. If omitted,
    falls back to parsing `query` for a budget phrase.
    """
    raw = fetch_products(category.value, query)
    products = [
        Product(
            id=p["id"], title=p["title"], price=p["price"],
            url=p["url"], source=p.get("source", "fallback"),
            category=category,
            image_url=p.get("image_url"),
            rating=p.get("rating"),
            reviews_count=p.get("reviews_count"),
            delivery=p.get("delivery"),
            old_price=p.get("old_price"),
        )
        for p in raw
    ]
    if not products:
        return []

    query_words = set(query.lower().split())
    budget = budget_cap if budget_cap is not None else extract_budget(query)
    prices = [p.price for p in products]
    median_price = statistics.median(prices)

    if budget is not None:
        valid_products = [p for p in products if budget * 0.1 <= p.price <= budget]
        if not valid_products:
            valid_products = [p for p in products if p.price <= budget]
    else:
        outlier_floor = median_price * 0.6
        valid_products = [p for p in products if p.price >= outlier_floor]

    if not valid_products:
        valid_products = products

    valid_prices = [p.price for p in valid_products]
    min_price = min(valid_prices)
    max_price = max(valid_prices)
    price_range = max_price - min_price if max_price > min_price else 1.0

    scored = []
    for p in valid_products:
        title_words = set(p.title.lower().split())
        matches = query_words & title_words
        relevance = len(matches) / max(len(query_words), 1)

        price_score = 1.0 - (p.price - min_price) / price_range
        median_closeness = 1 - abs(p.price - median_price) / max_price
        trust_bonus = 0.15 if is_trusted(p.source) else 0.0

        if budget is not None:
            total = 0.6 * relevance + 0.25 * price_score + trust_bonus
        else:
            total = 0.65 * relevance + 0.1 * price_score + 0.1 * median_closeness + trust_bonus

        scored.append(ScoredProduct(
            product = p,
            relevance_score = round(relevance, 3),
            price_score = round(price_score, 3),
            total_score = round(min(total, 1.0), 3),
        ))

    scored.sort(key = lambda s: s.total_score, reverse = True)
    return scored