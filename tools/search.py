from agents import function_tool
from schema import Product, ProductCategory
from services.fetch_layer import fetch_products


@function_tool
def search_products(category: ProductCategory, query: str) -> list[Product]:
    """Search for products in a given category matching the query."""
    raw = fetch_products(category.value, query)
    return [
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