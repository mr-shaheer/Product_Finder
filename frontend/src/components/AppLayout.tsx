import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { SearchBar } from "./SearchBar";
import { useSearch } from "../context/SearchContext";

export function AppLayout() {
  const location = useLocation();
  const { runSearch, status } = useSearch();
  const [value, setValue] = useState("");
  const isHome = location.pathname === "/";

  function handleSubmit(q: string) {
    setValue("");
    void runSearch(q, { navigateOnResult: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 pb-32 sm:pb-36">
        <Outlet />
      </main>

      {!isHome && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-2xl">
            <SearchBar
              value={value}
              onChange={setValue}
              onSubmit={handleSubmit}
              loading={status === "loading"}
              placeholder="Search for another product..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
