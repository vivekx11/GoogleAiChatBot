# Setup Guide — Jarvis AI OS (RunAnywhere Edition)

## Prerequisites
- Node.js 18+
- npm or yarn
- **RunAnywhere AI Studio** app on your Android/iOS device
  (Standard Expo Go does NOT include the native AI modules)
- EAS CLI (`npm install -g eas-cli`) — for APK builds

---

## 1. Clone & Install

```bash
cd backend && npm install
cd ../mobile && npm install
```

---

## 2. Configure Environment Variables

### Backend
```bash
cd backend
cp .env.example .env
```

Edit `.env` — only these are required:
```
PORT=3000
JWT_SECRET=your_very_long_random_secret_here

# Optional — for weather/news integrations
OPENWEATHER_API_KEY=...
NEWS_API_KEY=...
```

**No OpenAI key needed.** All AI runs on-device.

### Mobile
```bash
cd mobile
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
EXPO_PUBLIC_WS_URL=ws://YOUR_LOCAL_IP:3000/ws
```

> Use your machine's local IP (not localhost) for physical device testing.
> Find it: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

---

## 3. Start Backend

```bash
cd backend
npm run dev
```

Health check: `http://localhost:3000/health`

---

## 4. Run Mobile App

```bash
cd mobile
npx expo start
```

**Open in RunAnywhere AI Studio** (not Expo Go):
1. Install RunAnywhere AI Studio from the app store
2. Scan the QR code shown in your terminal

---

## 5. First Launch — Download AI Models

On first launch, the app shows a **"Download & Load Models"** banner.
Tap it to download the three on-device AI models (~540 MB total):

| Model | Size | Purpose |
|-------|------|---------|
| LFM2 350M Q8 | ~400 MB | LLM chat |
| Whisper Tiny EN | ~75 MB | Speech-to-Text |
| Piper EN-US | ~65 MB | Text-to-Speech |

Models are cached permanently — download only happens once.
After download, **all AI works offline**.

---

## 6. Build APK

```bash
cd mobile
eas login
eas build:configure
eas build --platform android --profile preview
```

The APK download link appears in your terminal and at https://expo.dev

---

## API Keys (Optional)

| Service | URL | Free Tier | Used For |
|---------|-----|-----------|---------|
| OpenWeatherMap | https://openweathermap.org/api | 1000/day | Weather commands |
| NewsAPI | https://newsapi.org | 100/day | News headlines |

Without these keys, weather/news commands return a "service unavailable" message.
All AI chat, voice, and app control still works without them.

---

## Troubleshooting

**"Native module not found"**
→ You must run in RunAnywhere AI Studio, not standard Expo Go

**"ReanimatedUIManager" errors**
→ You're using Reanimated 4.x — the project uses 3.x (already pinned in package.json)

**"Model download failed"**
→ Check internet connection and available storage (~600 MB needed)

**"STT returns empty"**
→ Speak clearly, ensure microphone permission is granted

**"Cannot connect to backend"**
→ Use machine IP (not localhost) in EXPO_PUBLIC_API_URL

---

## Architecture Notes

- **No OpenAI API** — LLM, STT, TTS all run on-device via RunAnywhere SDK
- Backend handles: auth, chat history persistence, intent routing, weather/news APIs
- Intent detection is rule-based (regex patterns) — zero latency, no API calls
- Chat history stored in SQLite, sent to device as context for on-device LLM
- JWT tokens stored in Expo SecureStore (encrypted)
- Deep linking uses Expo Linking for app control
