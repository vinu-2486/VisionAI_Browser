# Backend

FastAPI backend for VisionAI Browser.

## Responsibilities

- Provide supported form templates.
- Validate user-entered values.
- Manage the conversational flow for one field at a time.
- Return summaries for final user confirmation.

## Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
