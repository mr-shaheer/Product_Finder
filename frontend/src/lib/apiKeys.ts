const GEMINI_STORAGE_KEY = "product-finder:gemini-key";
const SERPAPI_STORAGE_KEY = "product-finder:serpapi-key";

export interface ApiKeys {
  gemini: string;
  serpapi: string;
}

export function loadKeys(): ApiKeys {
  try {
    return {
      gemini: localStorage.getItem(GEMINI_STORAGE_KEY) ?? "",
      serpapi: localStorage.getItem(SERPAPI_STORAGE_KEY) ?? "",
    };
  } catch {
    return { gemini: "", serpapi: "" };
  }
}

function setOrRemove(storageKey: string, value: string) {
  if (value) localStorage.setItem(storageKey, value);
  else localStorage.removeItem(storageKey);
}

export function persistKeys(keys: ApiKeys): void {
  try {
    setOrRemove(GEMINI_STORAGE_KEY, keys.gemini);
    setOrRemove(SERPAPI_STORAGE_KEY, keys.serpapi);
  } catch {
  }
}
