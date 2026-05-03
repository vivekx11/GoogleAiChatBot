/**
 * ModelService — React Context
 *
 * Manages RunAnywhere model download and load state.
 * Wrap your app with <ModelServiceProvider> to access model state
 * from any screen via useModelService().
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  initializeSDK,
  isModelDownloaded,
  downloadModel,
  loadLLM,
  loadSTT,
  loadTTS,
  MODEL_IDS,
  DownloadProgress,
} from './runanywhereService';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ModelState {
  sdkReady: boolean;

  // Load state
  isLLMLoaded: boolean;
  isSTTLoaded: boolean;
  isTTSLoaded: boolean;

  // Download state
  llmProgress: number;   // 0–100
  sttProgress: number;
  ttsProgress: number;
  isLLMDownloading: boolean;
  isSTTDownloading: boolean;
  isTTSDownloading: boolean;

  // Errors
  error: string | null;

  // Actions
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

// ─── Provider ──────────────────────────────────────────────────────────────

export function ModelServiceProvider({ children }: { children: React.ReactNode }) {
  const [sdkReady, setSdkReady] = useState(false);
  const [isLLMLoaded, setIsLLMLoaded] = useState(false);
  const [isSTTLoaded, setIsSTTLoaded] = useState(false);
  const [isTTSLoaded, setIsTTSLoaded] = useState(false);
  const [llmProgress, setLLMProgress] = useState(0);
  const [sttProgress, setSTTProgress] = useState(0);
  const [ttsProgress, setTTSProgress] = useState(0);
  const [isLLMDownloading, setIsLLMDownloading] = useState(false);
  const [isSTTDownloading, setIsSTTDownloading] = useState(false);
  const [isTTSDownloading, setIsTTSDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize SDK on mount
  useEffect(() => {
    initializeSDK()
      .then(() => setSdkReady(true))
      .catch((err) => setError(`SDK init failed: ${err.message}`));
  }, []);

  // ── Download + load helpers ──────────────────────────────────────────────

  const setupLLM = useCallback(async () => {
    try {
      setError(null);
      const downloaded = await isModelDownloaded(MODEL_IDS.llm);
      if (!downloaded) {
        setIsLLMDownloading(true);
        await downloadModel(MODEL_IDS.llm, (p: DownloadProgress) => {
          setLLMProgress(p.progress);
        });
        setIsLLMDownloading(false);
      }
      await loadLLM();
      setIsLLMLoaded(true);
    } catch (err: any) {
      setIsLLMDownloading(false);
      setError(`LLM setup failed: ${err.message}`);
      throw err;
    }
  }, []);

  const setupSTT = useCallback(async () => {
    try {
      setError(null);
      const downloaded = await isModelDownloaded(MODEL_IDS.stt);
      if (!downloaded) {
        setIsSTTDownloading(true);
        await downloadModel(MODEL_IDS.stt, (p: DownloadProgress) => {
          setSTTProgress(p.progress);
        });
        setIsSTTDownloading(false);
      }
      await loadSTT();
      setIsSTTLoaded(true);
    } catch (err: any) {
      setIsSTTDownloading(false);
      setError(`STT setup failed: ${err.message}`);
      throw err;
    }
  }, []);

  const setupTTS = useCallback(async () => {
    try {
      setError(null);
      const downloaded = await isModelDownloaded(MODEL_IDS.tts);
      if (!downloaded) {
        setIsTTSDownloading(true);
        await downloadModel(MODEL_IDS.tts, (p: DownloadProgress) => {
          setTTSProgress(p.progress);
        });
        setIsTTSDownloading(false);
      }
      await loadTTS();
      setIsTTSLoaded(true);
    } catch (err: any) {
      setIsTTSDownloading(false);
      setError(`TTS setup failed: ${err.message}`);
      throw err;
    }
  }, []);

  /**
   * Download and load all three models in parallel
   */
  const setupAll = useCallback(async () => {
    await Promise.all([setupLLM(), setupSTT(), setupTTS()]);
  }, [setupLLM, setupSTT, setupTTS]);

  return (
    <ModelContext.Provider
      value={{
        sdkReady,
        isLLMLoaded,
        isSTTLoaded,
        isTTSLoaded,
        llmProgress,
        sttProgress,
        ttsProgress,
        isLLMDownloading,
        isSTTDownloading,
        isTTSDownloading,
        error,
        setupAll,
        setupLLM,
        setupSTT,
        setupTTS,
        clearError: () => setError(null),
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}
