/**
 * RunAnywhere Service
 *
 * Wraps the RunAnywhere SDK for:
 *   - On-device LLM (LFM2 350M via LlamaCPP)
 *   - On-device STT (Whisper Tiny via ONNX)
 *   - On-device TTS (Piper via ONNX)
 *   - Voice Agent pipeline (VAD → STT → LLM → TTS)
 *
 * Everything runs locally — no API keys, no internet required for AI.
 */

import { RunAnywhere, SDKEnvironment, ModelCategory } from '@runanywhere/core';
import { LlamaCPP } from '@runanywhere/llamacpp';
import { ONNX, ModelArtifactType } from '@runanywhere/onnx';

// ─── Model IDs ─────────────────────────────────────────────────────────────
export const MODEL_IDS = {
  llm: 'lfm2-350m-q8_0',
  stt: 'sherpa-onnx-whisper-tiny.en',
  tts: 'vits-piper-en_US-lessac-medium',
} as const;

// ─── Model URLs ────────────────────────────────────────────────────────────
const MODEL_URLS = {
  llm: 'https://huggingface.co/LiquidAI/LFM2-350M-GGUF/resolve/main/LFM2-350M-Q8_0.gguf',
  stt: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/sherpa-onnx-whisper-tiny.en.tar.gz',
  tts: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/vits-piper-en_US-lessac-medium.tar.gz',
};

// ─── Jarvis system prompt ──────────────────────────────────────────────────
export const JARVIS_SYSTEM_PROMPT = `You are Jarvis, a highly intelligent personal AI assistant — like Tony Stark's AI.
You are helpful, witty, and concise. You can answer questions, help with tasks, and have natural conversations.
Keep responses brief (2-3 sentences) unless detail is requested.
You support both English and Hindi.`;

// ─── Progress callback type ────────────────────────────────────────────────
export type DownloadProgress = {
  modelId: string;
  progress: number; // 0–100
};

// ─── SDK Initialization ────────────────────────────────────────────────────

let _initialized = false;

/**
 * Initialize the RunAnywhere SDK and register backends.
 * Call once at app startup (in _layout.tsx).
 */
export async function initializeSDK(): Promise<void> {
  if (_initialized) return;

  await RunAnywhere.initialize({
    environment: SDKEnvironment.Development,
  });

  // Register LLM backend (LlamaCPP for GGUF models)
  LlamaCPP.register();

  // Register ONNX backend (for Whisper STT + Piper TTS)
  ONNX.register();

  // Register model definitions (safe to call multiple times)
  await LlamaCPP.addModel({
    id: MODEL_IDS.llm,
    name: 'LiquidAI LFM2 350M',
    url: MODEL_URLS.llm,
    memoryRequirement: 400_000_000,
  });

  await ONNX.addModel({
    id: MODEL_IDS.stt,
    name: 'Whisper Tiny EN',
    url: MODEL_URLS.stt,
    modality: ModelCategory.SpeechRecognition,
    artifactType: ModelArtifactType.TarGzArchive,
    memoryRequirement: 75_000_000,
  });

  await ONNX.addModel({
    id: MODEL_IDS.tts,
    name: 'Piper TTS EN-US',
    url: MODEL_URLS.tts,
    modality: ModelCategory.SpeechSynthesis,
    artifactType: ModelArtifactType.TarGzArchive,
    memoryRequirement: 65_000_000,
  });

  _initialized = true;
}

// ─── Model Download & Load ─────────────────────────────────────────────────

/**
 * Check if a model is already downloaded
 */
export async function isModelDownloaded(modelId: string): Promise<boolean> {
  const info = await RunAnywhere.getModelInfo(modelId);
  return !!info?.localPath;
}

/**
 * Download a model with progress callback
 */
export async function downloadModel(
  modelId: string,
  onProgress?: (p: DownloadProgress) => void
): Promise<void> {
  await RunAnywhere.downloadModel(modelId, (progress: { progress: number }) => {
    onProgress?.({
      modelId,
      progress: Math.round(progress.progress * 100),
    });
  });
}

/**
 * Load LLM model into memory
 */
export async function loadLLM(): Promise<void> {
  const info = await RunAnywhere.getModelInfo(MODEL_IDS.llm);
  if (!info?.localPath) throw new Error('LLM model not downloaded');
  await RunAnywhere.loadModel(info.localPath);
}

/**
 * Load STT (Whisper) model
 */
export async function loadSTT(): Promise<void> {
  const info = await RunAnywhere.getModelInfo(MODEL_IDS.stt);
  if (!info?.localPath) throw new Error('STT model not downloaded');
  await RunAnywhere.loadSTTModel(info.localPath, 'whisper');
}

/**
 * Load TTS (Piper) model
 */
export async function loadTTS(): Promise<void> {
  const info = await RunAnywhere.getModelInfo(MODEL_IDS.tts);
  if (!info?.localPath) throw new Error('TTS model not downloaded');
  await RunAnywhere.loadTTSModel(info.localPath, 'piper');
}

// ─── LLM Chat ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Build a prompt string from conversation history + system prompt
 */
function buildPrompt(history: ChatMessage[], userMessage: string): string {
  const lines: string[] = [JARVIS_SYSTEM_PROMPT, ''];
  for (const msg of history.slice(-10)) {
    lines.push(`${msg.role === 'user' ? 'User' : 'Jarvis'}: ${msg.content}`);
  }
  lines.push(`User: ${userMessage}`);
  lines.push('Jarvis:');
  return lines.join('\n');
}

/**
 * Generate a streaming chat response
 */
export async function chatStream(
  userMessage: string,
  history: ChatMessage[] = [],
  onToken?: (token: string, accumulated: string) => void
): Promise<string> {
  const prompt = buildPrompt(history, userMessage);

  const streamResult = await RunAnywhere.generateStream(prompt, {
    maxTokens: 300,
    temperature: 0.7,
  });

  let fullResponse = '';
  for await (const token of streamResult.stream) {
    fullResponse += token;
    onToken?.(token, fullResponse);
  }

  return fullResponse.trim();
}

/**
 * Simple one-shot chat (no streaming)
 */
export async function chat(userMessage: string, history: ChatMessage[] = []): Promise<string> {
  const prompt = buildPrompt(history, userMessage);
  return RunAnywhere.chat(prompt);
}

// ─── Speech-to-Text ────────────────────────────────────────────────────────

/**
 * Start microphone recording via RunAnywhere.Audio
 */
export async function startRecording(): Promise<void> {
  await RunAnywhere.Audio.requestPermission();
  await RunAnywhere.Audio.startRecording();
}

/**
 * Stop recording and transcribe with on-device Whisper
 */
export async function stopAndTranscribe(language = 'en'): Promise<string> {
  const recording = await RunAnywhere.Audio.stopRecording();

  if (!recording?.uri) {
    throw new Error('No audio recorded');
  }

  // Read audio file as base64 for Whisper
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RNFS = require('react-native-fs');
  const audioBase64: string = await RNFS.readFile(recording.uri, 'base64');

  const result = await RunAnywhere.transcribe(audioBase64, {
    sampleRate: 16000,
    language: language === 'hi' ? 'hi' : 'en',
  });

  return (result.text as string) || '';
}

/**
 * Cancel recording without transcribing
 */
export async function cancelRecording(): Promise<void> {
  try {
    await RunAnywhere.Audio.stopRecording();
  } catch (_) {
    // ignore
  }
}

// ─── Text-to-Speech ────────────────────────────────────────────────────────

/**
 * Synthesize text and play it on-device via Piper TTS.
 * Falls back to system TTS if Piper model is not loaded.
 */
export async function speak(
  text: string,
  options: { rate?: number; pitch?: number; volume?: number } = {}
): Promise<void> {
  const { rate = 1.0, pitch = 1.0, volume = 1.0 } = options;

  // Strip markdown and action JSON blocks before speaking
  const cleanText = text
    .replace(/\{[^}]*"action"[^}]*\}/g, '')
    .replace(/[*_`#]/g, '')
    .trim();

  if (!cleanText) return;

  try {
    // On-device Piper TTS
    const result = await RunAnywhere.synthesize(cleanText, { rate, pitch, volume });

    // Convert float32 PCM → WAV and play
    const wavPath = await RunAnywhere.Audio.createWavFromPCMFloat32(
      result.audio,
      result.sampleRate || 22050
    );
    await RunAnywhere.Audio.playAudio(wavPath);
  } catch (_err) {
    // Piper not loaded — fall back to platform system TTS
    try {
      await RunAnywhere.speak(cleanText, { rate, pitch, volume });
    } catch (__) {
      // Silently ignore TTS failures — don't crash the app
    }
  }
}

/**
 * Stop any ongoing TTS playback
 */
export async function stopSpeaking(): Promise<void> {
  try {
    await RunAnywhere.Audio.stopPlayback();
  } catch (_) {
    try {
      await RunAnywhere.stopSpeaking();
    } catch (__) {
      // ignore
    }
  }
}

// ─── Voice Agent Pipeline ──────────────────────────────────────────────────

export type VoiceSessionEvent = {
  type:
    | 'started' | 'listening' | 'speechStarted' | 'speechEnded'
    | 'processing' | 'transcribed' | 'responded' | 'speaking'
    | 'turnCompleted' | 'stopped' | 'error';
  transcription?: string;
  response?: string;
  audioLevel?: number;
  error?: string;
};

/**
 * Start a full voice session (VAD → STT → LLM → TTS).
 * Models must already be loaded before calling this.
 * Returns a handle with a stop() method.
 */
export async function startVoiceSession(
  onEvent: (event: VoiceSessionEvent) => void,
  systemPrompt = JARVIS_SYSTEM_PROMPT
): Promise<{ stop: () => void }> {
  // VoiceSessionConfig — model IDs come from already-loaded models, not config
  const session = await RunAnywhere.startVoiceSession(
    {
      systemPrompt,
      continuousMode: true,
      silenceDuration: 1.5,
      speechThreshold: 0.1,
      autoPlayTTS: true,
      onEvent: (event: { type: string; transcription?: string; response?: string; audioLevel?: number; error?: string }) => {
        onEvent({
          type: event.type as VoiceSessionEvent['type'],
          transcription: event.transcription,
          response: event.response,
          audioLevel: event.audioLevel,
          error: event.error,
        });
      },
    }
  );

  return session as unknown as { stop: () => void };
}
