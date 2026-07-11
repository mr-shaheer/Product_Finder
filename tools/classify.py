from agents import function_tool
from schema import ClassifiedQuery, ProductCategory


@function_tool
def classify_query(query: str) -> ClassifiedQuery:
    query_lower = query.lower()
    keywords: dict[ProductCategory, list[str]] = {
        ProductCategory.ELECTRONICS: ["phone", "laptop", "headphone", "charger", "cable", "tablet", "camera", "speaker", "tv", "monitor"],
        ProductCategory.FASHION_APPAREL: ["shirt", "jeans", "dress", "shoes", "jacket", "hat", "socks", "belt", "watch"],
        ProductCategory.HOME_KITCHEN: ["pan", "pot", "cup", "plate", "knife", "blender", "toaster", "furniture", "lamp", "decor"],
        ProductCategory.BEAUTY_PERSONAL_CARE: ["serum", "moisturizer", "shampoo", "soap", "cream", "lipstick", "perfume", "toothbrush"],
        ProductCategory.SPORTS_OUTDOORS: ["yoga", "gym", "hiking", "bike", "tent", "water bottle", "shoes", "racket", "ball"],
    }
    best_category = ProductCategory.ELECTRONICS
    best_score = 0
    for category, words in keywords.items():
        score = sum(1 for w in words if w in query_lower)
        if score > best_score:
            best_score = score
            best_category = category
    return ClassifiedQuery(
        category=best_category,
        original_query=query,
        confidence=min(0.5 + best_score * 0.15, 0.98),
        reasoning=f"Query contains {best_score} keyword(s) matching {best_category.value.replace('_', ' ')}.",
    )