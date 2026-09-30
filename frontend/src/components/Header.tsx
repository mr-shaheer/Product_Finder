import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { History, RotateCcw, Search } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import { getSearchHistory, clearSearchHistory } from "../lib/history";

export function Header() {
  const navigate = useNavigate();
  const { restoreSearch, startNewSearch } = useSearch();
  const [historyOpen, setHistoryOpen] = useState(false);

  const recent = getSearchHistory();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <button
          onClick={() => navigate("/")}
          className="flex shrink-0 items-center gap-2 rounded-md text-[15px] font-medium tracking-tight text-[var(--color-ink)]"
          aria-label="Product Finder home"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[var(--color-ink)] text-white">
            <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          Product Finder
        </button>

        <div className="ml-auto flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
              aria-label="Recent searches"
              aria-expanded={historyOpen}
            >
              <History className="h-[18px] w-[18px]" />
            </button>
            {historyOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setHistoryOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-11 z-20 w-72 rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-[var(--shadow-float)]">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-medium text-[var(--color-ink-muted)]">
                      Recent searches
                    </span>
                    {recent.length > 0 && (
                      <button
                        onClick={() => {
                          clearSearchHistory();
                          setHistoryOpen(false);
                        }}
                        className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {recent.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-[var(--color-ink-faint)]">
                      No searches yet.
                    </p>
                  ) : (
                    <ul className="max-h-72 overflow-auto">
                      {recent.map((item) => (
                          <li key={item.id}>
                            <button
                              onClick={() => {
                                setHistoryOpen(false);
                                restoreSearch(item);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
                            >
                              <Search className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-faint)]" />
                              <span className="truncate">{item.query}</span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={startNewSearch}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
            aria-label="Start a new search"
          >
            <RotateCcw className="h-[15px] w-[15px]" />
            <span className="hidden sm:inline">New search</span>
          </button>
        </div>
      </div>
    </header>
  );
}
