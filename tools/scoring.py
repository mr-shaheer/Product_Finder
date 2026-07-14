from agents import function_tool
from schema import Product, ScoredProduct


@function_tool
def normalize_and_score(products: list[Product], query: str) -> list[ScoredProduct]:
    if not products:
        return []
    query_words = set(query.lower().split())
    prices = [p.price for p in products]
    min_price = min(prices)
    max_price = max(prices)
    price_range = max_price - min_price if max_price > min_price else 1.0
    scored = []
    for p in products:
        title_words = set(p.title.lower().split())
        matches = query_words & title_words
        relevance = len(matches) / max(len(query_words), 1)
        price_score = 1.0 - (p.price - min_price) / price_range
        total = 0.7 * relevance + 0.3 * price_score
        scored.append(ScoredProduct(
            product=p,
            relevance_score=round(relevance, 3),
            price_score=round(price_score, 3),
            total_score=round(total, 3),
        ))
    scored.sort(key=lambda s: s.total_score, reverse=True)
    return scored