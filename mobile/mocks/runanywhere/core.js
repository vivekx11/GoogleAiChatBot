/**
 * Mock for @runanywhere/core
 * Used during development when the native SDK is not available.
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
  getModelInfo: async (_id) => null,
  downloadModel: async (_id, _onProgress) => {},
  loadModel: async (_path) => {},
  loadSTTModel: async (_path, _engine) => {},
  loadTTSModel: async (_path, _engine) => {},
  unloadModel: async () => {},
  unloadSTTModel: async () => {},
  unloadTTSModel: async () => {},
  isSTTModelLoaded: async () => false,
  generate: async (_prompt, _opts) => ({ text: '', latencyMs: 0 }),
  generateStream: async (_prompt, _opts) => ({
    stream: (async function* () {})(),
    result: Promise.resolve({ tokensPerSecond: 0 }),
    cancel: () => {},
  }),
  chat: async (_prompt) => 'RunAnywhere SDK not available in this build.',
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
