# API

## Backend endpoints

The backend exposes the form schema, conversation, validation, and review flow used by the browser frontend. All backend routes are prefixed with `/api`.

- `GET /api/health` - health check.
- `GET /api/forms/services` - list supported services and fields.
- `GET /api/forms/services/{service_type}` - retrieve one service template.
- `POST /api/conversation/start` - create a guided form session.
- `POST /api/conversation/message` - validate an answer and ask the next question.
- `POST /api/validation/check` - validate a field value or form payload.
- `POST /api/forms/{application_id}/review` - move a complete application to review.
- `POST /api/forms/{application_id}/confirm` - explicitly confirm before submission.

## Example payload

```json
{
  "service_type": "income_certificate",
  "language": "en"
}
```

## Notes

The React app uses the conversation endpoints directly. Browser speech recognition supplies the message text; the optional AI service exposes server-side Faster-Whisper transcription for clients that need it.

`POST /api/conversation/message` keeps the existing response fields and may add accepted field values for React state synchronization:

```json
{
  "session_id": "session-id",
  "message": "My name is Vinu Priya and my mobile number is 9876543210"
}
```

```json
{
  "session_id": "session-id",
  "application_id": 12,
  "user_message": "My name is Vinu Priya and my mobile number is 9876543210",
  "assistant_message": "I've entered your name and mobile number.",
  "current_field": "email",
  "next_field": "email",
  "completed": false,
  "validation_errors": [],
  "fields": {
    "fullName": "Vinu Priya",
    "mobile": "9876543210"
  },
  "fallback_to_client": false
}
```
