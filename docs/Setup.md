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

## Browser shell

```bash
cd browser
npm install
npm start
```

## AI services

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```
