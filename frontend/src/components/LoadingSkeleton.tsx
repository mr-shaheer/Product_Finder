export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="flex flex-col gap-3 p-4">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-5 w-1/2 rounded" />
        <div className="skeleton h-2 w-full rounded-full" />
        <div className="skeleton h-8 w-full rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="skeleton aspect-square w-full rounded-2xl" />
      <div className="flex flex-col gap-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-7 w-3/4 rounded" />
        <div className="skeleton h-6 w-1/3 rounded" />
        <div className="skeleton h-24 w-full rounded-xl" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full border-b border-[var(--color-border)] last:border-0" />
      ))}
    </div>
  );
}
