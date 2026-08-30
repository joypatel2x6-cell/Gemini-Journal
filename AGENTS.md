# Enterprise-Grade Directives & Constitution

This document defines the persistent security, architectural, and quality directives for the **Personal Gemini Journal** application.

---

## 1. Authentication & Identity Directives
- **Firebase Authentication**: All user authentication flows must strictly utilize Firebase Auth with verified tokens.
- **Unique UID Enforcement**: Every user must be uniquely identified by their verified Firebase UID (`request.auth.uid`).
- **No Client Trust for UIDs**: The backend server and Firestore security rules must never trust a `userId` or `uid` provided in request parameters or bodies. Identity must be verified via decoded session tokens or `request.auth`.

---

## 2. Cloud Firestore & Data Isolation Rules
- **Per-User Isolation**: User journals, reflections, and analyses are stored in isolated sub-collections under `/users/{userId}/entries/{entryId}`.
- **Strict Firestore Security Rules**:
  - Globally readable or writable collections are strictly forbidden for private user data.
  - Read, write, update, and delete permissions are constrained by `request.auth.uid == userId`.
  - Default deny catch-all `match /{document=**} { allow read, write: if false; }`.
- **Validation & Size Limits**: Payload sizes and field types must be bounded (e.g. content length limits, valid ID constraints) to prevent database manipulation.

---

## 3. Secret Management & Server-Side AI Execution
- **Zero Client-Side AI Keys**: Gemini API keys and sensitive credentials must NEVER exist in client-side bundles or `VITE_` prefixed variables.
- **Server-Side API Routes**: All Gemini calls (entry analysis, multi-turn companion chat, cognitive perspective shifting, time capsule retrospectives, and proactive prompt generation) must be routed through server endpoints (`/api/gemini/*`).
- **Secure Secret Sourcing**: Credentials are read from environment variables (`process.env.GEMINI_API_KEY`) or Google Cloud Secret Manager.

---

## 4. Threat Modeling & Defense in Depth
- **Prompt Injection Defense**: User entries and journal contents are isolated and formatted within clear delimiter boundaries before submission to LLMs.
- **Input Validation & Sanitization**: All incoming request bodies are validated for structure, type, and length before processing.
- **Error Obfuscation**: Production error responses must never expose stack traces, internal paths, raw API keys, or database schemas.
- **Multi-Model Fallback Engine**: Server-side LLM calls implement graceful cascades across available Gemini models (`gemini-3.1-flash-lite`, `gemini-3.7-flash`, etc.) to guarantee resilience against rate limits or temporary outages.

---

## 5. Architectural Cleanliness & Separation of Concerns
- **Modular TypeScript Structure**: Clear separation between UI components (`src/components/`), reactive state contexts (`src/context/`), domain constants (`src/constants/`), shared types (`src/types.ts`), and backend services (`server.ts`).
