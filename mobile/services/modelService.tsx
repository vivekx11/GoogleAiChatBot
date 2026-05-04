/**
 * ModelService — React Context
 *
 * With the real implementation (expo-speech + backend API),
 * there are no models to download. Everything is always "ready".
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { initializeSDK } from './runanywhereService';

interface ModelState {
  sdkReady: boolean;
  isLLMLoaded: boolean;
  isSTTLoaded: boolean;
  isTTSLoaded: boolean;
  llmProgress: number;
  sttProgress: number;
  ttsProgress: number;
  isLLMDownloading: boolean;
  isSTTDownloading: boolean;
  isTTSDownloading: boolean;
  error: string | null;
  setupAll: () => Promise<void>;
  setupLLM: () => Promise<void>;
  setupSTT: () => Promise<void>;
  setupTTS: () => Promise<void>;
  clearError: () => void;
}

const ModelContext = createContext<ModelState | null>(null);

export function useModelService(): ModelState {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error('useModelService must be used inside <ModelServiceProvider>');
  return ctx;
}

export function ModelServiceProvider({ children }: { children: React.ReactNode }) {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    initializeSDK()
      .then(() => setSdkReady(true))
      .catch(() => setSdkReady(true)); // Always proceed
  }, []);

  const noop = useCallback(async () => {}, []);

  return (
    <ModelContext.Provider
      value={{
        sdkReady,
        isLLMLoaded: true,
        isSTTLoaded: true,
        isTTSLoaded: true,
        llmProgress: 100,
        sttProgress: 100,
        ttsProgress: 100,
        isLLMDownloading: false,
        isSTTDownloading: false,
        isTTSDownloading: false,
        error: null,
        setupAll: noop,
        setupLLM: noop,
        setupSTT: noop,
        setupTTS: noop,
        clearError: noop,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}
