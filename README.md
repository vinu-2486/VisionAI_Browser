# VisionAI Browser

VisionAI Browser is a browser-based conversational assistant for accessible government form filling. It combines a React/Vite web app, FastAPI orchestration, and speech tools to guide users through applications one field at a time in Tamil or English.

## Core idea

- Detect government application forms from the webpage DOM.
- Ask the user for each required field in natural language.
- Validate and confirm responses before filling the form.
- Summarize the completed application and request final approval before submission.

## Repository layout

- `frontend/` - React UI for the browser shell and assistant panels.
- `backend/` - FastAPI service for form orchestration and validation.
- `browser/` - legacy desktop-shell prototype; not required by the current web workflow.
- `ai/` - Speech, LLM, prompt, and text-to-speech helpers.
- `database/` - SQLite schema and seed data for the prototype.
- `knowledge-base/` - Sample form knowledge, mappings, prompts, and translations.
- `datasets/` - Example documents, audio samples, and test data.
- `docs/` - Architecture, API, setup, and project timeline notes.

## Prototype workflow

1. Open the React web app in a supported browser.
2. Choose Income Certificate and start the assistant.
3. Answer each sample-form field by voice or text.
4. Validate and confirm the recognized values.
5. Present a final summary before any submission.

## Status

This repository currently contains starter code and scaffolding for the prototype implementation.

## Next steps

1. Install dependencies for the frontend, backend, and AI services.
2. Connect the browser DOM analyzer to the backend form schema API.
3. Wire speech input and output to the assistant conversation loop.
4. Add service-specific knowledge packs for the supported government forms.
