import { streamJsonEvents } from "../lib/sse";
import type { SearchStreamEvent } from "../types/product";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class BackendUnavailableError extends Error {
  constructor() {
    super(
      "Unable to connect to Product Finder. Check that the FastAPI server is running."
    );
    this.name = "BackendUnavailableError";
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function resetSession(sessionId: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/session/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
  } catch {
    // Best-effort — a failed reset call shouldn't block starting a new search.
  }
}

/**
 * Runs one turn of the real agent workflow and streams progress events as
 * they happen. Throws BackendUnavailableError on network failure so callers
 * can show a clear "server isn't running" message rather than a raw error.
 */
export async function searchProducts(
  sessionId: string,
  query: string,
  onEvent: (event: SearchStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    await streamJsonEvents<SearchStreamEvent>(
      `${API_BASE_URL}/api/search/stream`,
      { session_id: sessionId, query },
      onEvent,
      signal
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return;
    }
    throw new BackendUnavailableError();
  }
}
