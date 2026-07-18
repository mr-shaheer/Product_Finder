import re   
import statistics
from agents import function_tool
from schema import Product, ScoredProduct

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
def normalize_and_score(products: list[Product], query: str) -> list[ScoredProduct]:
    if not products:
        return []

    query_words = set(query.lower().split())
    budget = extract_budget(query)
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