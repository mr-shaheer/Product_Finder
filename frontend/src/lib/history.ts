import type { ClassifiedQuery, ScoredProduct } from "../types/product";

const HISTORY_KEY = "product-finder:search-history";
const MAX_ITEMS = 10;

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  classification: ClassifiedQuery | null;
  products: ScoredProduct[];
  message: string;
}

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is SearchHistoryItem =>
        item &&
        typeof item.id === "string" &&
        typeof item.query === "string" &&
        typeof item.timestamp === "number" &&
        Array.isArray(item.products)
    );
  } catch {
    return [];
  }
}

export function saveSearchHistory(item: SearchHistoryItem): void {
  const existing = getSearchHistory().filter(
    (search) => search.query.toLowerCase() !== item.query.toLowerCase()
  );

  const next = [item, ...existing].slice(0, MAX_ITEMS);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function clearSearchHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}