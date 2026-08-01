# Architecture

## Overview

VisionAI Browser is split into four main runtime layers:

1. Electron browser shell for the desktop application.
2. React frontend for the assistant and form-review experience.
3. FastAPI backend for orchestration, validation, and session state.
4. AI services for speech recognition, language understanding, and text-to-speech.

## Data flow

```mermaid
flowchart TD
    A[User Voice Input] --> B[Speech-to-Text Engine]
    B --> C[AI Conversation Module]
    C --> D[Webpage Understanding Module]
    D --> E[Form Field Detection]
    E --> F[Form Filling Engine]
    F --> G[Validation Module]
    G --> H[Text-to-Speech Feedback]
    H --> I[User Confirmation]
    I --> J[Form Submission]
```

## Main responsibilities

- `browser/` handles page navigation, DOM extraction, and IPC with the UI.
- `frontend/` renders the assistant, history, and submission summary.
- `backend/` exposes APIs for form schemas, validation, and conversation state.
- `ai/` contains reusable helpers for speech and prompt-driven field extraction.

## Safety boundaries

- The assistant requests confirmation before submission.
- CAPTCHA solving is not automated.
- Sensitive values should only be filled after explicit user confirmation.
