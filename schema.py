from enum import Enum
from pydantic import BaseModel

class ProductCategory(str, Enum):
     Electronics = "electronics"
     Fashion_Apparel = "fashion_apparel"
     Home_Kitchen = "home_kitchen"
     Beauty_Personal_Care = "beauty_personal_care"
     Sports_Outdoors = "sports_outdoors"

class Product(BaseModel):
     id: str
     title: str
     price: float
     currency: str = "USD"
     url: str
     source: str
     category: ProductCategory
     image_url: str | None = None
     rating: float | None = None
     reviews_count: int | None = None
     delivery: str | None = None
     old_price: float | None = None

class ScoredProduct(BaseModel):
     product: Product
     relevance_score: float
     price_score: float
     total_score: float

class ClassifiedQuery(BaseModel):
     category: ProductCategory
     original_query: str
     confidence: float
     reasoning: str