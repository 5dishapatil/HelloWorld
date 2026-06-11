# SafetyNet

SafetyNet, is a digital-safety learning platform built for elders, first-time internet users, and anyone who wants to practice recognizing online scams in a safe environment.

The app combines guided sandbox exercises, scam-awareness lessons, quizzes, badges, a voice-guided helper called Bambi, and an AI-powered scam simulator. Nothing in the training modules uses real bank accounts, real identity data, or real financial actions.

## What This Project Includes

- **Guided sandbox modules** for practicing real-world digital tasks safely.
- **Bank statement sandbox** that simulates a banking flow and teaches users how to navigate account screens without exposing real data.
- **DigiLocker sandbox** that walks users through a safe digital-document setup experience.
- **Red Flag Detector** modules for phishing emails, fake alerts, suspicious SMS, WhatsApp-style messages, and scam signals.
- **AI Scam Simulator** where users practice responding to fake scam conversations and learn when to refuse, stop, or report.
- **Deepfake Lab** for spotting visual signs of fake or AI-generated photos and videos.
- **Community Siren** for reporting and browsing scam warnings by category.
- **Progress dashboard and badges** that reward completed modules.
- **Bambi voice guide** for simple voice-assisted navigation and encouragement.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI components
- Lucide React icons
- React Router

### Backend

- Node.js
- Express
- Google Gemini via `@google/genai`
- Local JSON session storage for scam simulator sessions
- Optional MongoDB connection hook

## Repository Structure

```text
.
├── backend/
│   ├── app.js                     # Express server entry point
│   ├── config/db.js               # Optional MongoDB connection
│   ├── controllers/               # Scam simulator API logic
│   ├── middleware/                # Demo auth middleware
│   ├── models/                    # Local JSON scam session model
│   ├── public/                    # Standalone scam simulator UI served by backend
│   ├── routes/                    # Express routes
│   ├── services/                  # Gemini integration
│   └── utils/                     # Input validation and simulator guardrails
├── frontend/
│   ├── src/app/
│   │   ├── components/            # Layout, Bambi guide, shared UI
│   │   ├── pages/                 # Main learning pages and modules
│   │   ├── routes.tsx             # Frontend route definitions
│   │   └── utils/                 # Auth and translation helpers
│   ├── assets/                    # Module images and training assets
│   └── vite.config.ts
├── package.json                   # Root dev script for frontend + backend
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- A Gemini API key if you want live AI scam responses

### Install Dependencies

Install dependencies in the root, backend, and frontend folders:

```bash
npm install
cd backend
npm install
cd ../frontend
npm install
```

### Configure Environment Variables

Create a `.env` file inside `backend/`:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash,gemini-2.5-flash-lite,gemini-flash-latest
MONGO_URI=
```

Notes:

- `GEMINI_API_KEY` is required for generated AI scam replies.
- `GEMINI_MODEL` is optional. If omitted, the backend tries the default Gemini model list.
- `MONGO_URI` is optional. The current scam-session persistence is implemented with local JSON storage in `backend/data/scamSessions.json`.

### Run the App

From the repository root:

```bash
npm run dev
```

This starts:

- Backend: `http://localhost:5000`
- Frontend: Vite dev server, usually `http://localhost:5173`

You can also run each side manually:

```bash
cd backend
npm start
```

```bash
cd frontend
npm run dev
```

## Main Frontend Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/login` | Demo login page |
| `/startJourney` | Intro journey page |
| `/home` | Module hub |
| `/dashboard` | Progress and badge dashboard |
| `/sandbox/module1` | Bank statement sandbox |
| `/sandbox/module2` | DigiLocker sandbox |
| `/red-flag-detector` | Red flag module selection |
| `/red-flag-detector/module1` | Phishing email lesson |
| `/red-flag-detector/module2` | Message scam lesson |
| `/red-flag-detector/module2/quiz` | Message scam quiz |
| `/ai-scam-simulator` | Embedded AI scam simulator |
| `/deepfake-lab` | Deepfake recognition lab |
| `/community` | Community scam-reporting page |

## Backend API

The backend is served from `http://localhost:5000`.

### Health Check

```http
GET /api/health
```

Returns a simple message confirming that the API is running.

### Scam Simulator Sessions

All scam-session routes expect a demo user ID in the request header:

```http
x-user-id: demo-user-id
```

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/scam-sessions/start` | Start a new scam simulation |
| `POST` | `/api/scam-sessions/:sessionId/message` | Send a user reply and get the next scammer response |
| `GET` | `/api/scam-sessions/history` | List sessions for the current demo user |
| `GET` | `/api/scam-sessions/:sessionId` | Fetch one session |
| `PATCH` | `/api/scam-sessions/:sessionId/end` | End a session manually |
| `DELETE` | `/api/scam-sessions/:sessionId` | Delete a session |

Supported scam types include:

- `bank_impersonation`
- `delivery_fraud`
- `tech_support`
- `relational_scam`

## How the AI Scam Simulator Works

The simulator starts with a fake scam message, then uses Gemini to continue the conversation. Backend guardrails track whether the user:

- refuses suspicious requests,
- asks questions,
- shares sensitive information,
- falls for the scam,
- or successfully defends themselves.

The session ends when the user shares sensitive information, refuses enough times, manually ends the session, or reaches the maximum turn limit.

The frontend page at `/ai-scam-simulator` embeds the backend's standalone simulator UI from `http://localhost:5000`.

## Progress and Badges

The frontend stores badge progress in `localStorage`. Visiting supported modules unlocks badges, and completing enough modules can unlock the Digital Guardian badge.

Badge-related logic lives in:

```text
frontend/src/app/components/ui/Usebadges.tsx
```

## Authentication Notes

This project currently uses demo authentication:

- Frontend login stores `isAuth=true` in `localStorage`.
- Backend scam routes use the `x-user-id` header as the current user.

For production, replace this with real authentication such as Firebase Auth, JWT sessions, or another secure identity provider.

## Development Notes

- The frontend uses the alias `@` for `frontend/src`.
- The backend serves static files from `backend/public`.
- The AI simulator can show helpful error messages if the Gemini key is missing, invalid, expired, or out of quota.
- Local scam-session data is generated under `backend/data/` when simulator sessions are created.
- The repository contains a built frontend output in `frontend/dist/`, but development should usually happen through Vite.

## Suggested Next Improvements

- Replace demo auth with a real authentication system.
- Connect simulator session storage fully to MongoDB or another database.
- Add automated tests for scam-session guardrails and API responses.
- Make the AI simulator API base configurable in the frontend instead of hardcoding `localhost:5000`.
- Add deployment documentation for frontend and backend hosting.
