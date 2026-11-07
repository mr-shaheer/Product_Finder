import type { ProviderId } from "./providers";

const SETTINGS_KEY = "product-finder:llm-settings:v2";
const LEGACY_GEMINI_KEY = "product-finder:gemini-key";
const SERPAPI_STORAGE_KEY = "product-finder:serpapi-key";

export interface ApiKeys {
  provider: ProviderId;
  /** "" means "use the provider's default model". */
  model: string;
  /** Only used by the "custom" provider. */
  baseUrl: string;
  /** One key per provider, so switching providers doesn't lose the others. */
  llmKeys: Partial<Record<ProviderId, string>>;
  serpapi: string;
}

export const EMPTY_KEYS: ApiKeys = {
  provider: "gemini",
  model: "",
  baseUrl: "",
  llmKeys: {},
  serpapi: "",
};

export function activeLlmKey(keys: ApiKeys): string {
  return keys.llmKeys[keys.provider] ?? "";
}

export function loadKeys(): ApiKeys {
  try {
    const serpapi = localStorage.getItem(SERPAPI_STORAGE_KEY) ?? "";
    const raw = localStorage.getItem(SETTINGS_KEY);

    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ApiKeys>;
      return {
        provider: parsed.provider ?? "gemini",
        model: parsed.model ?? "",
        baseUrl: parsed.baseUrl ?? "",
        llmKeys: parsed.llmKeys ?? {},
        serpapi,
      };
    }

    // Migrate the old single Gemini key.
    const legacy = localStorage.getItem(LEGACY_GEMINI_KEY) ?? "";
    return { ...EMPTY_KEYS, llmKeys: legacy ? { gemini: legacy } : {}, serpapi };
  } catch {
    return { ...EMPTY_KEYS };
  }
}

export function persistKeys(keys: ApiKeys): void {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        provider: keys.provider,
        model: keys.model,
        baseUrl: keys.baseUrl,
        llmKeys: keys.llmKeys,
      })
    );
    if (keys.serpapi) localStorage.setItem(SERPAPI_STORAGE_KEY, keys.serpapi);
    else localStorage.removeItem(SERPAPI_STORAGE_KEY);
    localStorage.removeItem(LEGACY_GEMINI_KEY);
  } catch {
    // Storage can be blocked (private mode). Keys then live only in memory.
  }
}