import { useState } from "react";
import { SearchBar } from "../components/SearchBar";
import { SearchSuggestions } from "../components/SearchSuggestions";
import { useSearch } from "../context/SearchContext";

export default function Home() {
  const { runSearch, status } = useSearch();
  const [value, setValue] = useState("");

  function handleSubmit(q: string) {
    void runSearch(q, { navigateOnResult: true });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 sm:px-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 pt-16 text-center">
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

      <div className="flex flex-col items-center gap-4 pb-14 pt-6 sm:pb-20">
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
