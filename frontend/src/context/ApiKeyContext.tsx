import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { activeLlmKey, loadKeys, persistKeys, type ApiKeys } from "../lib/apiKeys";
import { getProvider, type ProviderInfo } from "../lib/providers";

interface ApiKeyContextValue {
  keys: ApiKeys;
  hasLlmKey: boolean;
  activeProvider: ProviderInfo;
  activeModel: string;
  modalOpen: boolean;
  openKeyModal: () => void;
  closeKeyModal: () => void;
  saveKeys: (keys: ApiKeys) => void;
  saveModel: (model: string) => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<ApiKeys>(loadKeys);
  const [modalOpen, setModalOpen] = useState(false);

  const openKeyModal = useCallback(() => setModalOpen(true), []);
  const closeKeyModal = useCallback(() => setModalOpen(false), []);

  const saveKeys = useCallback((next: ApiKeys) => {
    const llmKeys = Object.fromEntries(
      Object.entries(next.llmKeys)
        .map(([id, value]) => [id, (value ?? "").trim()])
        .filter(([, value]) => value)
    ) as ApiKeys["llmKeys"];

    const cleaned: ApiKeys = {
      provider: next.provider,
      model: next.model.trim(),
      baseUrl: next.baseUrl.trim(),
      llmKeys,
      serpapi: next.serpapi.trim(),
    };
    persistKeys(cleaned);
    setKeys(cleaned);
    setModalOpen(false);
  }, []);

  const saveModel = useCallback((model: string) => {
    setKeys((prev) => {
      const next = { ...prev, model: model.trim() };
      persistKeys(next);
      return next;
    });
  }, []);

  const value = useMemo<ApiKeyContextValue>(() => {
    const activeProvider = getProvider(keys.provider);
    return {
      keys,
      hasLlmKey: activeLlmKey(keys).length > 0,
      activeProvider,
      activeModel: keys.model || activeProvider.defaultModel,
      modalOpen,
      openKeyModal,
      closeKeyModal,
      saveKeys,
      saveModel,
    };
  }, [keys, modalOpen, openKeyModal, closeKeyModal, saveKeys, saveModel]);

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
}

export function useApiKeys(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKeys must be used within an ApiKeyProvider");
  return ctx;
}