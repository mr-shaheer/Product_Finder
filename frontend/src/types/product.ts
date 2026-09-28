// Mirrors productfinder/schema.py exactly.

export type ProductCategory =
  | "electronics"
  | "fashion_apparel"
  | "home_kitchen"
  | "beauty_personal_care"
  | "sports_outdoors";

export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  source: string;
  category: ProductCategory;
  image_url: string | null;
  rating: number | null;
  reviews_count: number | null;
  delivery: string | null;
  old_price: number | null;
}

export interface ScoredProduct {
  product: Product;
  relevance_score: number;
  price_score: number;
  total_score: number;
}

export interface ClassifiedQuery {
  category: ProductCategory;
  original_query: string;
  confidence: number;
  reasoning: string;
}

// ---- API event stream payloads (api/agent_runtime.py) ----

export type SearchStreamEvent =
  | { type: "handoff"; agent: string }
  | { type: "tool_called"; tool: string | null }
  | { type: "classified"; category: ProductCategory; confidence: number }
  | { type: "searched"; count: number }
  | { type: "scored"; count: number }
  | {
      type: "done";
      session_id: string;
      agent: string;
      handed_off: boolean;
      classification: ClassifiedQuery | null;
      products_found: number;
      products: ScoredProduct[];
      message: string;
    }
  | { type: "blocked"; message: string }
  | { type: "error"; message: string };

export interface SearchOutcome {
  query: string;
  events: SearchStreamEvent[];
  result: Extract<SearchStreamEvent, { type: "done" }> | null;
  blocked: string | null;
  error: string | null;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  electronics: "Electronics",
  fashion_apparel: "Fashion & Apparel",
  home_kitchen: "Home & Kitchen",
  beauty_personal_care: "Beauty & Personal Care",
  sports_outdoors: "Sports & Outdoors",
};
