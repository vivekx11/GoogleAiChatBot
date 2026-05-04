/**
 * Mock for @runanywhere/core
 * All operations succeed silently — no real AI runs in this build.
 */

const SDKEnvironment = {
  Development: 'development',
  Staging: 'staging',
  Production: 'production',
};

const ModelCategory = {
  SpeechRecognition: 'speech_recognition',
  SpeechSynthesis: 'speech_synthesis',
  TextGeneration: 'text_generation',
};

const SDKErrorCode = {
  notInitialized: 'NOT_INITIALIZED',
  modelNotLoaded: 'MODEL_NOT_LOADED',
  modelNotFound: 'MODEL_NOT_FOUND',
  sttFailed: 'STT_FAILED',
  ttsFailed: 'TTS_FAILED',
  generationFailed: 'GENERATION_FAILED',
  voiceAgentFailed: 'VOICE_AGENT_FAILED',
};

const AudioModule = {
  requestPermission: async () => {},
  startRecording: async () => {},
  stopRecording: async () => ({ uri: '', durationMs: 0 }),
  stopPlayback: async () => {},
  playAudio: async (_path) => {},
  createWavFromPCMFloat32: async (_audio, _sampleRate) => '',
  getAudioLevel: async () => ({ level: 0 }),
};

const RunAnywhere = {
  initialize: async (_opts) => {},

  // Return a fake "downloaded" model so loadLLM/loadSTT/loadTTS never throw
  getModelInfo: async (modelId) => ({
    id: modelId,
    name: modelId,
    localPath: `/mock/models/${modelId}`,
    isDownloaded: true,
  }),

  downloadModel: async (_id, onProgress) => {
    // Simulate instant 100% download
    if (onProgress) onProgress({ progress: 1, state: 'completed' });
  },

  loadModel: async (_path) => {},
  loadSTTModel: async (_path, _engine) => {},
  loadTTSModel: async (_path, _engine) => {},
  unloadModel: async () => {},
  unloadSTTModel: async () => {},
  unloadTTSModel: async () => {},
  isSTTModelLoaded: async () => true,

  generate: async (_prompt, _opts) => ({ text: 'Mock response', latencyMs: 0 }),

  generateStream: async (_prompt, _opts) => {
    const mockTokens = ['Hello', '! ', 'I', ' am', ' Jarvis', '.', ' How', ' can', ' I', ' help', '?'];
    return {
      stream: (async function* () {
        for (const token of mockTokens) {
          yield token;
        }
      })(),
      result: Promise.resolve({ tokensPerSecond: 0 }),
      cancel: () => {},
    };
  },

  chat: async (_prompt) => 'Hello! I am Jarvis. The AI backend is not connected yet.',

  transcribe: async (_audio, _opts) => ({ text: '', confidence: 0, duration: 0 }),
  transcribeBuffer: async (_samples, _opts) => ({ text: '', confidence: 0, duration: 0 }),
  transcribeFile: async (_path, _opts) => ({ text: '', confidence: 0, duration: 0 }),

  synthesize: async (_text, _opts) => ({ audio: '', sampleRate: 22050, numSamples: 0, duration: 0 }),
  speak: async (_text, _opts) => {},
  stopSpeaking: async () => {},
  isSpeaking: async () => false,

  startVoiceSession: async (_config, _cb) => ({
    stop: () => {},
    events: async function* () {},
  }),

  Audio: AudioModule,
};

function isSDKError(err) {
  return err != null && typeof err === 'object' && 'code' in err && 'message' in err;
}

module.exports = { RunAnywhere, SDKEnvironment, ModelCategory, SDKErrorCode, isSDKError };
