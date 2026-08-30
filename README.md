# 📓 Personal Gemini Journal

> An AI-powered personal journaling platform with private user isolation, mood analytics, reflective summaries, and Gemini-powered insights.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📝 **Rich Journal Editor** | Write entries with mood tagging, custom tags, and reading-time estimates |
| 🤖 **AI Entry Analysis** | Per-entry Gemini analysis: mood detection, reflection questions, growth opportunities |
| 📊 **AI Insights Dashboard** | Weekly/monthly/all-time reports with emotional evolution, patterns, and affirmations |
| 💬 **Brainstorm Chat** | Multi-turn companion chat to explore thoughts and journal prompts |
| 🔄 **Perspective Shift** | Reframe thoughts through Stoic, Compassion, Future Self, and Growth Scientist lenses |
| ⏳ **Time Capsule** | Seal entries with a future unlock date and intention |
| 📈 **Mood Analytics** | Streak tracking, word count trends, and mood distribution charts |
| 🔐 **Secure & Private** | Every entry is strictly isolated per user — no shared data, ever |

---

## 🏗️ Architecture

```
┌─────────────────────┐        ┌──────────────────────────┐
│   React Frontend    │◄──────►│   Express Backend (BFF)  │
│  (Vite + TailwindCSS│        │     server.ts            │
│   + Motion)         │        │  /api/gemini/*           │
└─────────────────────┘        └────────────┬─────────────┘
         │                                  │
         ▼                                  ▼
┌─────────────────────┐        ┌──────────────────────────┐
│  Firebase Auth      │        │  Google Gemini AI        │
│  Cloud Firestore    │        │  (server-side only)      │
│  (per-user isolated)│        │  Google Cloud Secret Mgr │
└─────────────────────┘        └──────────────────────────┘
```

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion (animations)
- **Backend**: Express.js BFF server — all Gemini calls are server-side only
- **Auth & DB**: Firebase Authentication + Cloud Firestore
- **AI**: Google Gemini API (`@google/genai`) via server-side routes
- **Secrets**: Google Cloud Secret Manager (with `.env` fallback for local dev)

---

## 🗂️ Project Structure

```
Gemini-Journal/
├── src/
│   ├── components/
│   │   ├── AIInsightsView.tsx       # Insights reports UI
│   │   ├── AuthModal.tsx            # Login / sign-up modal
│   │   ├── BrainstormChatModal.tsx  # Multi-turn AI companion chat
│   │   ├── Dashboard.tsx            # Main dashboard & stats
│   │   ├── EntriesList.tsx          # Browse & search entries
│   │   ├── FirebaseGuideModal.tsx   # Setup guide for Firebase config
│   │   ├── JournalEditor.tsx        # Rich entry editor
│   │   ├── Navbar.tsx               # Top navigation bar
│   │   ├── PerspectiveShiftModal.tsx# Cognitive perspective shifting
│   │   └── TimeCapsuleModal.tsx     # Time capsule sealing/opening
│   ├── constants/                   # App-wide constants & mood metadata
│   ├── context/                     # React contexts (Auth, Journal state)
│   ├── firebase/                    # Firebase initialisation & helpers
│   ├── types.ts                     # Shared TypeScript types
│   ├── App.tsx                      # Root component & routing
│   └── main.tsx                     # Entry point
├── server.ts                        # Express BFF + Vite dev middleware
├── firestore.rules                  # Firestore security rules
├── firebase-blueprint.json          # Firebase project blueprint
├── vite.config.ts
├── tsconfig.json
├── .env.example                     # Environment variable template
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18 and **Bun** (or npm/yarn)
- A **Firebase project** with Authentication and Firestore enabled
- A **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com)

### 1. Clone & Install

```bash
git clone <repo-url>
cd Gemini-Journal
bun install   # or: npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```env
# Required: your Gemini API key (never exposed to the client)
GEMINI_API_KEY=your_gemini_api_key_here

# Required: the URL where this app is hosted (used for CORS / redirects)
APP_URL=http://localhost:3000
```

> **Production**: In production, `GEMINI_API_KEY` is automatically fetched from **Google Cloud Secret Manager** (secret name: `gemini-api-key`). The `.env` value is only used as a local fallback.

### 3. Configure Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** and **Anonymous** authentication
3. Create a **Cloud Firestore** database
4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Add your Firebase config to the app (the in-app **Firebase Guide** modal will walk you through this)

### 4. Run Locally

```bash
bun run dev   # or: npm run dev
```

The app runs at **http://localhost:3000** — the Express server serves both the API routes and the Vite dev frontend.

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start the dev server (Express + Vite HMR) |
| `bun run build` | Build frontend with Vite + bundle server with esbuild |
| `bun run start` | Run the production build (`dist/server.cjs`) |
| `bun run lint` | Type-check with `tsc --noEmit` |
| `bun run clean` | Remove the `dist/` directory |

---

## 🔐 Security Model

This application is built with a **defense-in-depth** security posture:

- **No client-side AI keys** — `GEMINI_API_KEY` is never bundled into the frontend or exposed via `VITE_` variables. All Gemini calls go through `/api/gemini/*` server routes.
- **Firebase UID verification** — Identity is always verified from decoded Firebase tokens server-side; no `userId` from request bodies is trusted.
- **Per-user Firestore isolation** — Data lives under `/users/{userId}/entries/{entryId}`. Rules enforce `request.auth.uid == userId` on every operation.
- **Default deny** — All Firestore paths not explicitly allowed are blocked by a catch-all `allow read, write: if false` rule.
- **Input validation** — Request bodies are validated for structure, type, and size (content <= 100,000 characters) before any processing.
- **Prompt injection defense** — User content is isolated within clear delimiter boundaries before being submitted to Gemini.
- **Error obfuscation** — Production error responses never expose stack traces, internal paths, or credentials.
- **Secret Manager** — In production, credentials are fetched from **Google Cloud Secret Manager** with Application Default Credentials.

---

## 🌐 API Routes

All routes are served by the Express backend (`server.ts`):

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/gemini/analyze-entry` | Analyze a single journal entry |
| `POST` | `/api/gemini/insights` | Generate period insights report |
| `POST` | `/api/gemini/brainstorm` | Multi-turn companion chat |
| `POST` | `/api/gemini/perspective-shift` | Cognitive reframing via 4 lenses |
| `POST` | `/api/gemini/time-capsule-retrospective` | Open time capsule retrospective |
| `POST` | `/api/gemini/proactive-prompt` | Generate a personalized journal prompt |

---

## 🛡️ Firestore Security Rules

Rules enforce strict per-user isolation. Key principles:

```js
// Only the authenticated owner can read/write their own data
function isOwner(userId) {
  return request.auth != null && request.auth.uid == userId;
}

// All unmatched paths are denied by default
match /{document=**} {
  allow read, write: if false;
}

// Entries are isolated under /users/{userId}/entries/{entryId}
match /users/{userId}/entries/{entryId} {
  allow get, list: if isOwner(userId);
  allow create: if isOwner(userId) && incoming().content.size() <= 100000;
  // ...
}
```

---

## 🧠 AI Features (Powered by Gemini)

All AI features use the **`@google/genai`** SDK, called exclusively from the server:

- **Entry Analysis** — Detects mood, emotional tone, positive moments, stressors, and generates reflection questions
- **Insights Reports** — Synthesises patterns across multiple entries (weekly, monthly, or all-time)
- **Brainstorm Chat** — Conversational companion with context-aware multi-turn memory
- **Perspective Shift** — Applies 4 cognitive lenses (Stoic · Compassion · Future Self · Growth Scientist)
- **Time Capsule Retrospective** — Reflects on a past sealed entry when it's unlocked
- **Proactive Prompts** — Generates personalised journaling prompts based on recent mood history

---

## 📄 License

This project is private. All rights reserved.
