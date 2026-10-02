import type { ScoredProduct } from "../types/product";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  compareIds,
  onToggleCompare,
  ranked = false,
}: {
  products: ScoredProduct[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  /** When true, each card gets its 1-based position as a "Top Recommendation" rank. */
  ranked?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((item, index) => (
        <ProductCard
          key={item.product.id}
          item={item}
          compareChecked={compareIds.includes(item.product.id)}
          onToggleCompare={onToggleCompare}
          rank={ranked ? index + 1 : undefined}
        />
      ))}
    </div>
  );
}
