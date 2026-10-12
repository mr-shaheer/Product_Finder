import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { searchProducts, resetSession as apiResetSession } from "../api/productFinderApi";
import { useApiKeys } from "./ApiKeyContext";
import { getSessionId, resetSessionId } from "../lib/session";
import { saveSearchHistory, type SearchHistoryItem } from "../lib/history";
import type { ClassifiedQuery, ScoredProduct, SearchStreamEvent } from "../types/product";

export type SearchStatus =
  | "idle"
  | "loading"
  | "clarifying"
  | "done"
  | "blocked"
  | "error";

interface SearchState {
  sessionId: string;
  status: SearchStatus;
  query: string;
  events: SearchStreamEvent[];
  classification: ClassifiedQuery | null;
  products: ScoredProduct[];
  message: string | null;
  handedOff: boolean;
  usedFallback: boolean;
  errorMessage: string | null;
  compareIds: string[];
}

interface RunSearchOptions {
  navigateOnResult?: boolean;
  isClarifyReply?: boolean;
}

interface SearchContextValue extends SearchState {
  runSearch: (query: string, opts?: RunSearchOptions) => Promise<void>;
  restoreSearch: (search: SearchHistoryItem) => void;
  startNewSearch: () => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  getProductById: (id: string) => ScoredProduct | undefined;
}

const SearchContext = createContext<SearchContextValue | null>(null);

const initialState = (): SearchState => ({
  sessionId: getSessionId(),
  status: "idle",
  query: "",
  events: [],
  classification: null,
  products: [],
  message: null,
  handedOff: false,
  usedFallback: false,
  errorMessage: null,
  compareIds: [],
});

export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SearchState>(initialState);
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);
  const { keys, openKeyModal } = useApiKeys();

  const runSearch = useCallback(
    async (query: string, opts?: RunSearchOptions) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      if (!keys.gemini) {
        openKeyModal();
        return;
      }

      const fullQuery =
        opts?.isClarifyReply && state.query ? `${state.query} ${trimmed}` : trimmed;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({
        ...prev,
        status: "loading",
        query: fullQuery,
        events: [],
        message: null,
        errorMessage: null,
        usedFallback: false,
      }));

      if (opts?.navigateOnResult) {
        navigate("/results");
      }

      try {
        await searchProducts(
          state.sessionId,
          fullQuery,
          keys,
          (event) => {
            if (
              event.type === "error" &&
              (event.code === "missing_key" || event.code === "invalid_key")
            ) {
              openKeyModal();
            }

            setState((prev) => {
              const events = [...prev.events, event];

              if (event.type === "done") {
                if (event.handed_off) {
                  saveSearchHistory({
                    id: crypto.randomUUID(),
                    query: fullQuery,
                    timestamp: Date.now(),
                    classification: event.classification,
                    products: event.products,
                    message: event.message,
                  });
                }

                return {
                  ...prev,
                  events,
                  status: event.handed_off ? "done" : "clarifying",
                  classification: event.classification,
                  products: event.products,
                  message: event.message,
                  handedOff: event.handed_off,
                  usedFallback: event.used_fallback,
                };
              }

              if (event.type === "blocked") {
                return { ...prev, events, status: "blocked", errorMessage: event.message };
              }

              if (event.type === "error") {
                return { ...prev, events, status: "error", errorMessage: event.message };
              }

              return { ...prev, events };
            });
          },
          controller.signal
        );

        if (opts?.navigateOnResult) {
          navigate("/results");
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          status: "error",
          errorMessage: err instanceof Error ? err.message : "Something went wrong.",
        }));
      }
    },
    [state.sessionId, state.query, keys, openKeyModal, navigate]
  );

  const restoreSearch = useCallback(
    (search: SearchHistoryItem) => {
      abortRef.current?.abort();

      setState((prev) => ({
        ...prev,
        status: "done",
        query: search.query,
        events: [],
        classification: search.classification,
        products: search.products,
        message: search.message,
        handedOff: true,
        usedFallback: false,
        errorMessage: null,
        compareIds: [],
      }));

      navigate("/results");
    },
    [navigate]
  );

  const startNewSearch = useCallback(() => {
    abortRef.current?.abort();
    const newId = resetSessionId();
    void apiResetSession(newId);
    setState({ ...initialState(), sessionId: newId });
    navigate("/");
  }, [navigate]);

  const toggleCompare = useCallback((id: string) => {
    setState((prev) => {
      const has = prev.compareIds.includes(id);
      const compareIds = has
        ? prev.compareIds.filter((c) => c !== id)
        : prev.compareIds.length >= 4
          ? prev.compareIds
          : [...prev.compareIds, id];
      return { ...prev, compareIds };
    });
  }, []);

  const clearCompare = useCallback(() => {
    setState((prev) => ({ ...prev, compareIds: [] }));
  }, []);

  const getProductById = useCallback(
    (id: string) => state.products.find((p) => p.product.id === id),
    [state.products]
  );

  const value = useMemo<SearchContextValue>(
    () => ({
      ...state,
      runSearch,
      restoreSearch,
      startNewSearch,
      toggleCompare,
      clearCompare,
      getProductById,
    }),
    [
      state,
      runSearch,
      restoreSearch,
      startNewSearch,
      toggleCompare,
      clearCompare,
      getProductById,
    ]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within a SearchProvider");
  return ctx;
}