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

## AI services

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100
```

Open `http://localhost:5173` in Chrome or Edge. The voice button uses browser speech recognition and the text box remains available when microphone permissions or browser support are unavailable.
