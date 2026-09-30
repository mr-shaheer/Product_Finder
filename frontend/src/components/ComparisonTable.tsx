import { Star } from "lucide-react";
import type { ScoredProduct } from "../types/product";
import { ProductImage } from "./ProductImage";
import { CATEGORY_LABELS } from "../types/product";

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
  } catch {
    return `$${price.toFixed(2)}`;
  }
}

const ROWS: {
  label: string;
  render: (item: ScoredProduct) => React.ReactNode;
}[] = [
  {
    label: "Price",
    render: (item) => (
      <span className="tabular-nums font-semibold text-[var(--color-ink)]">
        {formatPrice(item.product.price, item.product.currency)}
      </span>
    ),
  },
  {
    label: "AI match",
    render: (item) => (
      <span className="tabular-nums font-semibold text-[var(--color-accent)]">
        {Math.round(item.total_score * 100)}%
      </span>
    ),
  },
  {
    label: "Rating",
    render: (item) =>
      item.product.rating !== null ? (
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-current" />
          {item.product.rating.toFixed(1)}
        </span>
      ) : (
        <span className="text-[var(--color-ink-faint)]">—</span>
      ),
  },
  {
    label: "Retailer",
    render: (item) => <span className="capitalize">{item.product.source}</span>,
  },
  {
    label: "Category",
    render: (item) => CATEGORY_LABELS[item.product.category],
  },
  {
    label: "Delivery",
    render: (item) => item.product.delivery ?? <span className="text-[var(--color-ink-faint)]">—</span>,
  },
];

export function ComparisonTable({ items }: { items: ScoredProduct[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-40 border-b border-[var(--color-border)] p-4 text-left text-xs font-medium text-[var(--color-ink-faint)]" />
            {items.map((item) => (
              <th
                key={item.product.id}
                className="border-b border-[var(--color-border)] p-4 text-left align-top"
              >
                <div className="mb-2 h-20 w-20 overflow-hidden rounded-xl bg-[var(--color-surface)]">
                  <ProductImage
                    src={item.product.image_url}
                    alt={item.product.title}
                    className="h-full w-full"
                  />
                </div>
                <p className="line-clamp-2 text-sm font-medium leading-snug text-[var(--color-ink)]">
                  {item.product.title}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label}>
              <td className="border-b border-[var(--color-border)] p-4 text-xs font-medium text-[var(--color-ink-muted)]">
                {row.label}
              </td>
              {items.map((item) => (
                <td
                  key={item.product.id}
                  className="border-b border-[var(--color-border)] p-4 text-[var(--color-ink)]"
                >
                  {row.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
