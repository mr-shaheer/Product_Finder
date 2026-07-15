from typing import Any

_FALLBACK_PRODUCTS: dict[str, list[dict[str, Any]]] = {
    "electronics": [
        {"id": "elec_001", "title": "Wireless Bluetooth Headphones", "price": 79.99, "url": "https://example.com/headphones", "source": "fallback"},
        {"id": "elec_002", "title": "USB-C Charging Hub 7-in-1", "price": 34.99, "url": "https://example.com/hub", "source": "fallback"},
    ],
    "fashion_apparel": [
        {"id": "fash_001", "title": "Classic Fit Cotton T-Shirt", "price": 24.99, "url": "https://example.com/tshirt", "source": "fallback"},
        {"id": "fash_002", "title": "Slim Denim Jeans", "price": 54.99, "url": "https://example.com/jeans", "source": "fallback"},
    ],
    "home_kitchen": [
        {"id": "home_001", "title": "Stainless Steel French Press", "price": 29.99, "url": "https://example.com/frenchpress", "source": "fallback"},
        {"id": "home_002", "title": "Non-Stick Ceramic Frying Pan", "price": 39.99, "url": "https://example.com/pan", "source": "fallback"},
    ],
    "beauty_personal_care": [
        {"id": "beau_001", "title": "Vitamin C Brightening Serum", "price": 18.99, "url": "https://example.com/serum", "source": "fallback"},
        {"id": "beau_002", "title": "Natural Bamboo Toothbrush Set", "price": 9.99, "url": "https://example.com/brush", "source": "fallback"},
    ],
    "sports_outdoors": [
        {"id": "sport_001", "title": "Insulated Hiking Water Bottle", "price": 22.99, "url": "https://example.com/bottle", "source": "fallback"},
        {"id": "sport_002", "title": "Yoga Mat with Carrying Strap", "price": 35.99, "url": "https://example.com/yogamat", "source": "fallback"},
    ],
}


def fallback(category: str, query: str) -> list[dict[str, Any]]:
    products = _FALLBACK_PRODUCTS.get(category, _FALLBACK_PRODUCTS["electronics"])
    return [dict(p, title=f"{p['title']} - {query}") for p in products]