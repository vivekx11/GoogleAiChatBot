/**
 * Local type declarations for @runanywhere packages.
 *
 * These shadow the SDK's own source-based types to avoid TypeScript
 * compiling the SDK's .ts source files (which contain internal bugs
 * that skipLibCheck doesn't catch because they're .ts, not .d.ts).
 */

declare module '@runanywhere/core' {
  export enum SDKEnvironment {
    Development = 'development',
    Staging = 'staging',
    Production = 'production',
  }

  export enum ModelCategory {
    SpeechRecognition = 'speech_recognition',
    SpeechSynthesis = 'speech_synthesis',
    TextGeneration = 'text_generation',
  }

  export interface ModelInfo {
    id: string;
    name: string;
    localPath?: string;
    isDownloaded?: boolean;
  }

  export interface GenerationOptions {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }

  export interface GenerationResult {
    text: string;
    latencyMs?: number;
    performanceMetrics?: { tokensPerSecond: number };
  }

  export interface StreamResult {
    stream: AsyncIterable<string>;
    result: Promise<{ tokensPerSecond: number }>;
    cancel: () => void;
  }

  export interface STTOptions {
    language?: string;
    sampleRate?: number;
    punctuation?: boolean;
  }

  export interface STTResult {
    text: string;
    confidence: number;
    duration: number;
  }

  export interface TTSOptions {
    voice?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  }

  export interface TTSResult {
    audio: string;
    sampleRate: number;
    numSamples: number;
    duration: number;
  }

  export interface VoiceSessionConfig {
    systemPrompt?: string;
    continuousMode?: boolean;
    silenceDuration?: number;
    speechThreshold?: number;
    autoPlayTTS?: boolean;
    language?: string;
    onEvent?: (event: VoiceSessionEvent) => void;
  }

  export interface VoiceSessionEvent {
    type:
      | 'started' | 'listening' | 'speechStarted' | 'speechEnded'
      | 'processing' | 'transcribed' | 'responded' | 'speaking'
      | 'turnCompleted' | 'stopped' | 'error';
    transcription?: string;
    response?: string;
    audioLevel?: number;
    error?: string;
  }

  export interface VoiceSessionHandle {
    stop: () => void;
    events: () => AsyncIterable<VoiceSessionEvent>;
  }

  export interface DownloadProgressEvent {
    progress: number; // 0–1
    state: 'downloading' | 'extracting' | 'completed' | 'failed';
  }

  export interface AudioModule {
    requestPermission: () => Promise<void>;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<{ uri: string; durationMs: number }>;
    stopPlayback: () => Promise<void>;
    playAudio: (path: string) => Promise<void>;
    createWavFromPCMFloat32: (base64Audio: string, sampleRate: number) => Promise<string>;
    getAudioLevel: () => Promise<{ level: number }>;
  }

  export const RunAnywhere: {
    initialize: (options: { environment: SDKEnvironment }) => Promise<void>;
    getModelInfo: (modelId: string) => Promise<ModelInfo | null>;
    downloadModel: (
      modelId: string,
      onProgress?: (p: DownloadProgressEvent) => void
    ) => Promise<void>;
    loadModel: (localPath: string) => Promise<void>;
    loadSTTModel: (localPath: string, engine: string) => Promise<void>;
    loadTTSModel: (localPath: string, engine: string) => Promise<void>;
    unloadModel: () => Promise<void>;
    unloadSTTModel: () => Promise<void>;
    unloadTTSModel: () => Promise<void>;
    isSTTModelLoaded: () => Promise<boolean>;
    generate: (prompt: string, options?: GenerationOptions) => Promise<GenerationResult>;
    generateStream: (prompt: string, options?: GenerationOptions) => Promise<StreamResult>;
    chat: (prompt: string) => Promise<string>;
    transcribe: (audioBase64: string, options?: STTOptions) => Promise<STTResult>;
    transcribeBuffer: (samples: Float32Array, options?: STTOptions) => Promise<STTResult>;
    transcribeFile: (path: string, options?: STTOptions) => Promise<STTResult>;
    synthesize: (text: string, options?: TTSOptions) => Promise<TTSResult>;
    speak: (text: string, options?: TTSOptions) => Promise<void>;
    stopSpeaking: () => Promise<void>;
    isSpeaking: () => Promise<boolean>;
    startVoiceSession: (
      config?: VoiceSessionConfig,
      callback?: (event: VoiceSessionEvent) => void
    ) => Promise<VoiceSessionHandle>;
    Audio: AudioModule;
  };

  export function isSDKError(err: unknown): err is { code: string; message: string };

  export const SDKErrorCode: {
    notInitialized: string;
    modelNotLoaded: string;
    modelNotFound: string;
    sttFailed: string;
    ttsFailed: string;
    generationFailed: string;
    voiceAgentFailed: string;
  };
}

declare module '@runanywhere/llamacpp' {
  export interface LLMModelConfig {
    id: string;
    name: string;
    url: string;
    memoryRequirement?: number;
  }

  export const LlamaCPP: {
    register: () => void;
    addModel: (config: LLMModelConfig) => Promise<void>;
  };
}

declare module '@runanywhere/onnx' {
  import { ModelCategory } from '@runanywhere/core';

  export enum ModelArtifactType {
    TarGzArchive = 'tar_gz_archive',
    ZipArchive = 'zip_archive',
    SingleFile = 'single_file',
  }

  export interface ONNXModelConfig {
    id: string;
    name: string;
    url: string;
    modality: ModelCategory;
    artifactType: ModelArtifactType;
    memoryRequirement?: number;
  }

  export const ONNX: {
    register: () => void;
    addModel: (config: ONNXModelConfig) => Promise<void>;
  };
}
