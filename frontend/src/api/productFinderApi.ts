import { streamJsonEvents } from "../lib/sse";
import type { ApiKeys } from "../lib/apiKeys";
import type { SearchStreamEvent } from "../types/product";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class BackendUnavailableError extends Error {
  constructor() {
    super(
      "Can't reach the Product Finder server. If it was idle it may be waking up. Wait a few seconds and try again."
    );
    this.name = "BackendUnavailableError";
  }
}

export interface KeyCheck {
  valid: boolean;
  message: string;
}

export interface ValidateResponse {
  gemini: KeyCheck | null;
  serpapi: KeyCheck | null;
}

/** The visitor's own keys travel in headers, never in the URL or body. */
function keyHeaders(keys: ApiKeys): Record<string, string> {
  const headers: Record<string, string> = {};
  if (keys.gemini) headers["X-Gemini-Key"] = keys.gemini;
  if (keys.serpapi) headers["X-Serpapi-Key"] = keys.serpapi;
  return headers;
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

/** Asks the backend whether the keys work (does not use up search quota). */
export async function validateKeys(keys: ApiKeys): Promise<ValidateResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/keys/validate`, {
      method: "POST",
      headers: keyHeaders(keys),
    });
    if (!res.ok) throw new BackendUnavailableError();
    return (await res.json()) as ValidateResponse;
  } catch {
    throw new BackendUnavailableError();
  }
}

/**
 * Runs one turn of the real agent workflow and streams progress events as
 * they happen. Throws BackendUnavailableError on network failure so callers
 * can show a clear message rather than a raw error.
 */
export async function searchProducts(
  sessionId: string,
  query: string,
  keys: ApiKeys,
  onEvent: (event: SearchStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    await streamJsonEvents<SearchStreamEvent>(
      `${API_BASE_URL}/api/search/stream`,
      { session_id: sessionId, query },
      onEvent,
      signal,
      keyHeaders(keys)
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return;
    }
    throw new BackendUnavailableError();
  }
}