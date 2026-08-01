# VisionAI Browser

VisionAI Browser is an AI-powered conversational browser for accessible government form filling. It combines Electron, React, FastAPI, and speech tools to guide users through online applications one field at a time in Tamil or English.

## Core idea

- Detect government application forms from the webpage DOM.
- Ask the user for each required field in natural language.
- Validate and confirm responses before filling the form.
- Summarize the completed application and request final approval before submission.

## Repository layout

- `frontend/` - React UI for the browser shell and assistant panels.
- `backend/` - FastAPI service for form orchestration and validation.
- `browser/` - Electron main process and browser automation bridge.
- `ai/` - Speech, LLM, prompt, and text-to-speech helpers.
- `database/` - SQLite schema and seed data for the prototype.
- `knowledge-base/` - Sample form knowledge, mappings, prompts, and translations.
- `datasets/` - Example documents, audio samples, and test data.
- `docs/` - Architecture, API, setup, and project timeline notes.

## Prototype workflow

1. Launch the Electron browser shell.
2. Navigate to a government portal.
3. Detect a form and extract its fields.
4. Ask for each required value by voice or text.
5. Validate and confirm the recognized values.
6. Fill the form and present a final summary.
7. Submit only after explicit user approval.

## Status

This repository currently contains starter code and scaffolding for the prototype implementation.

## Next steps

1. Install dependencies for the frontend, backend, browser shell, and AI services.
2. Connect the browser DOM analyzer to the backend form schema API.
3. Wire speech input and output to the assistant conversation loop.
4. Add service-specific knowledge packs for the supported government forms.
