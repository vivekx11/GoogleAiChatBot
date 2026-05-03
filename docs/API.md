# Jarvis API Reference

Base URL: `http://localhost:3000/api`

All protected routes require: `Authorization: Bearer <token>`

> **Note:** All AI (LLM, STT, TTS) runs on-device via RunAnywhere SDK.
> The backend only handles auth, persistence, intent routing, and external APIs.

---

## Auth

### POST /auth/register
```json
{ "name": "Tony Stark", "email": "tony@stark.com", "password": "ironman123", "language": "en" }
```
Response: `{ token, user }`

### POST /auth/login
```json
{ "email": "tony@stark.com", "password": "ironman123" }
```
Response: `{ token, user, settings }`

### GET /auth/me
Response: `{ user, settings }`

### PUT /auth/profile
```json
{ "name": "Tony", "language": "hi", "settings": { "auto_read_response": 1, "voice_speed": 1.2 } }
```

---

## Chat

### POST /chat/message
Saves user message, returns conversation history for on-device LLM.
```json
{ "message": "What is the weather?", "sessionId": "optional-uuid" }
```
Response:
```json
{
  "sessionId": "uuid",
  "messageId": "uuid",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```
Mobile uses `history` as context for `RunAnywhere.generateStream()`.

### POST /chat/save
Saves the AI response generated on-device.
```json
{ "sessionId": "uuid", "content": "AI response text", "tokensUsed": 42 }
```
Response: `{ ok: true }`

### GET /chat/sessions
Response: `{ sessions: [...] }`

### GET /chat/sessions/:id
Response: `{ session, messages: [...] }`

### DELETE /chat/sessions/:id

---

## Voice

> STT and TTS are on-device. This endpoint only does intent routing.

### POST /voice/command
Send transcript from on-device Whisper, get intent + action back.
```json
{ "text": "Open WhatsApp", "language": "en" }
```
Response:
```json
{
  "transcript": "Open WhatsApp",
  "intent": "OPEN_APP",
  "confidence": 0.85,
  "response": "Opening whatsapp...",
  "action": { "type": "OPEN_APP", "app": "whatsapp" },
  "useLocalLLM": false
}
```

When `useLocalLLM: true`, the mobile app runs `RunAnywhere.chat()` instead.

### GET /voice/history
Response: `{ commands: [...] }`

---

## Automation

### GET /automation
Response: `{ automations: [...] }`

### POST /automation
```json
{
  "name": "Study Mode",
  "trigger": "start study mode",
  "actions": [
    { "type": "OPEN_APP", "app": "spotify" },
    { "type": "NOTIFY", "message": "Study mode on!" }
  ]
}
```

### POST /automation/:id/run
Triggers automation, returns actions for client to execute.

### POST /automation/:id/toggle
Enables/disables automation.

---

## Integrations

### GET /integrations/weather?location=Mumbai&lang=en
Response: `{ city, temperature, condition, humidity, windSpeed, description }`

### GET /integrations/news?category=technology&lang=en
Response: `{ articles: [...], summary }`

---

## Intent Types

| Intent | Handled By | Action |
|--------|-----------|--------|
| OPEN_APP | Backend rule | `{ type: "OPEN_APP", app }` |
| SEND_MESSAGE | Backend rule | `{ type: "SEND_MESSAGE", app, contact, message }` |
| CALL | Backend rule | `{ type: "CALL", contact }` |
| SEARCH | Backend rule | `{ type: "SEARCH", query }` |
| TIME | Backend rule | No action (response only) |
| REMINDER | Backend rule | `{ type: "REMINDER", task, time }` |
| WEATHER | Weather API | `{ type: "WEATHER", data }` |
| NEWS | News API | `{ type: "NEWS", data }` |
| CHAT | **On-device LLM** | `useLocalLLM: true` |
| UNKNOWN | **On-device LLM** | `useLocalLLM: true` |
