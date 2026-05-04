# 🤖 Personal AI Operating System 
-----------------------------------------------
A production-ready mobile AI assistant built with React Native (Expo) + Node.js backend.
**All AI runs on-device via RunAnywhere SDK — no OpenAI API key needed.**

## Features
- 🎙️ Voice Assistant — on-device STT (Whisper) + TTS (Piper)
- 🧠 AI Chat — on-device LLM (LFM2 350M) with streaming + memory
- 📱 App Control via Deep Linking (WhatsApp, YouTube, Spotify, etc.)
- ⚙️ Automation Engine (custom voice-triggered workflows)
- 🌐 API Integrations (Weather, News)
- 🔐 JWT Authentication
- 🌙 Offline Mode — AI works without internet after first download
- 🌍 Multi-language (English + Hindi)

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo SDK 51) |
| On-device LLM | RunAnywhere SDK + LlamaCPP (LFM2 350M GGUF) |
| On-device STT | RunAnywhere SDK + ONNX (Whisper Tiny) |
| On-device TTS | RunAnywhere SDK + ONNX (Piper) |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT + bcrypt |
| State | Zustand |
| Navigation | Expo Router |

## AI Models (downloaded once, ~540 MB total)
| Model | Size | Purpose |
|-------|------|---------|
| LFM2 350M Q8 | ~400 MB | On-device LLM chat |
| Whisper Tiny EN | ~75 MB | Speech-to-Text |
| Piper EN-US Lessac | ~65 MB | Text-to-Speech |

## Architecture
```
┌─────────────────────────────────────────────────────┐
│                  Mobile App (Expo)                   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         RunAnywhere SDK (on-device)           │   │
│  │  LFM2 LLM ──► Whisper STT ──► Piper TTS      │   │
│  │  VAD ──► STT ──► LLM ──► TTS (Voice Agent)   │   │
│  └──────────────────────────────────────────────┘   │
│                        │                             │
│              Intent routing only                     │
│                        ▼                             │
│  ┌──────────────────────────────────────────────┐   │
│  │         Backend (Node.js/Express)             │   │
│  │  Auth ─ Chat History ─ Automations            │   │
│  │  Weather API ─ News API ─ Intent Router       │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Project Structure
```
jarvis/
├── mobile/                  # React Native Expo app
│   ├── app/                 # Expo Router screens
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom hooks
│   ├── store/               # Zustand state management
│   ├── services/
│   │   ├── runanywhereService.ts  # RunAnywhere SDK wrapper
│   │   ├── modelService.tsx       # Model download/load context
│   │   ├── api.ts                 # Backend API client
│   │   └── appControl.ts          # Deep linking
│   └── constants/           # Theme, app registry
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── intentService.js   # Rule-based intent detection
│   │   │   ├── weatherService.js
│   │   │   └── newsService.js
│   │   ├── middleware/
│   │   └── database/
└── docs/
```

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Only needs JWT_SECRET + weather/news keys
npm run dev
```

### Mobile
```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

> **Important:** Run in **RunAnywhere AI Studio** app (not standard Expo Go).
> AI Studio includes the native LlamaCPP and ONNX modules.

## First Run
On first launch, tap **"Download & Load Models"** in the app.
Models download once (~540 MB) and are cached on-device permanently.

## Environment Variables
Only these are needed — **no OpenAI key**:
```
JWT_SECRET=...
OPENWEATHER_API_KEY=...   (optional, for weather)
NEWS_API_KEY=...           (optional, for news)
```

## APK Build
```bash
cd mobile
eas login
eas build --platform android --profile preview
```
