# Setup

## Prerequisites

- Node.js 20+
- Python 3.11+
- npm or pnpm

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Create `backend/.env` from `backend/.env.example` and set `GEMINI_API_KEY` there. The React app never receives this key. If the key is missing or Gemini is unavailable, the conversation endpoint returns a safe clarification response and the existing local form fallback remains usable.

## AI services

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100
```

Open `http://localhost:5173` in Chrome or Edge. The voice button uses browser speech recognition and the text box remains available when microphone permissions or browser support are unavailable.

Voice requests flow through `POST /api/conversation/message`; the backend AI layer returns structured intents and fields, then deterministic validation persists accepted values before returning the existing conversation response fields.
