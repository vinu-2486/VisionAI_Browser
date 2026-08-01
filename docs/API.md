# API

## Backend endpoints

The initial backend exposes a small set of endpoints for the prototype.

- `GET /health` - health check.
- `GET /forms` - list supported form templates.
- `GET /forms/{form_id}` - retrieve one supported form template.
- `POST /conversation/next` - ask for the next field in a conversation flow.
- `POST /validation/check` - validate a field value or a form payload.

## Example payload

```json
{
  "form_id": "income_certificate",
  "current_field": "full_name",
  "answers": {
    "full_name": "Arun Kumar"
  }
}
```

## Notes

This API is intentionally lightweight so the browser shell can evolve independently from the form intelligence layer.
