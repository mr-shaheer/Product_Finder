const EXAMPLES = [
  "Best smartphone under $500",
  "Wireless headphones under $100",
  "Durable Sneakers for everyday walking",
  "Best Laptop for gaming",
];

export function SearchSuggestions({ onPick }: { onPick: (value: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {EXAMPLES.map((example) => (
        <button
          key={example}
          onClick={() => onPick(example)}
          className="rounded-full border border-[var(--color-border)] cursor-pointer bg-white px-3.5 py-1.5 text-sm text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]"
        >
          {example}
        </button>
      ))}
    </div>
  );
}
