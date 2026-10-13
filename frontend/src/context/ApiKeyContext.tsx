import {
     createContext,
     useCallback,
     useContext,
     useMemo,
     useState,
     type ReactNode,
   } from "react";
   import { loadKeys, persistKeys, type ApiKeys } from "../lib/apiKeys";
   
   interface ApiKeyContextValue {
     keys: ApiKeys;
     hasGeminiKey: boolean;
     modalOpen: boolean;
     openKeyModal: () => void;
     closeKeyModal: () => void;
     saveKeys: (keys: ApiKeys) => void;
   }
   
   const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);
   
   export function ApiKeyProvider({ children }: { children: ReactNode }) {
     const [keys, setKeys] = useState<ApiKeys>(loadKeys);
     const [modalOpen, setModalOpen] = useState(false);
   
     const openKeyModal = useCallback(() => setModalOpen(true), []);
     const closeKeyModal = useCallback(() => setModalOpen(false), []);
   
     const saveKeys = useCallback((next: ApiKeys) => {
       const cleaned = { gemini: next.gemini.trim(), serpapi: next.serpapi.trim() };
       persistKeys(cleaned);
       setKeys(cleaned);
       setModalOpen(false);
     }, []);
   
     const value = useMemo<ApiKeyContextValue>(
       () => ({
         keys,
         hasGeminiKey: keys.gemini.length > 0,
         modalOpen,
         openKeyModal,
         closeKeyModal,
         saveKeys,
       }),
       [keys, modalOpen, openKeyModal, closeKeyModal, saveKeys]
     );
   
     return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
   }
   
   export function useApiKeys(): ApiKeyContextValue {
     const ctx = useContext(ApiKeyContext);
     if (!ctx) throw new Error("useApiKeys must be used within an ApiKeyProvider");
     return ctx;
   }