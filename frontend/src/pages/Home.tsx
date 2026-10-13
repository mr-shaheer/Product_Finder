import { useState } from "react";
import { KeyRound } from "lucide-react";
import { SearchBar } from "../components/SearchBar";
import { SearchSuggestions } from "../components/SearchSuggestions";
import { useSearch } from "../context/SearchContext";
import { useApiKeys } from "../context/ApiKeyContext";

export default function Home() {
  const { runSearch, status } = useSearch();
  const { hasGeminiKey, openKeyModal } = useApiKeys();
  const [value, setValue] = useState("");

  function handleSubmit(q: string) {
    void runSearch(q, { navigateOnResult: true });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 sm:px-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
          Product Finder
        </p>
        <h1 className="text-3xl font-medium tracking-tight text-[var(--color-ink)] sm:text-4xl">
          Find the right product.
        </h1>
        <p className="max-w-md text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
          Search across products, compare options, and let AI help you make
          sense of the results.
        </p>
      </div>

      <div className="flex flex-col items-center gap-8 pb-8 pt-6 sm:pb-12">
        {!hasGeminiKey && (
          <button
            onClick={openKeyModal}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] hover:border-[var(--color-accent)]"
          >
            <KeyRound className="h-4 w-4" />
            Add your API key to get started
          </button>
        )}
        <SearchBar
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          loading={status === "loading"}
          autoFocus
        />
        <SearchSuggestions onPick={(v) => handleSubmit(v)} />
      </div>
    </div>
  );
}