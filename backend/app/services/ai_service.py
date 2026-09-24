import json
import logging
from typing import Any

from pydantic import ValidationError

from app.core.config import settings
from app.schemas.forms import AIIntentResponse
from app.services.forms_service import get_service

logger = logging.getLogger(__name__)

ALLOWED_INTENTS = {
    "update_fields",
    "correct_field",
    "query_form_status",
    "query_missing_fields",
    "repeat_question",
    "next_field",
    "previous_field",
    "confirm",
    "clarification",
    "unknown",
}


class AIService:
    def __init__(self) -> None:
        self._client: Any = None

    def _get_client(self) -> Any:
        if not settings.GEMINI_API_KEY:
            return None
        if self._client is None:
            from google import genai

            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._client

    def interpret(
        self,
        service_type: str,
        language: str,
        current_field: str | None,
        form_data: dict[str, Any],
        transcript: str,
        history: list[dict[str, str]],
    ) -> AIIntentResponse:
        service = get_service(service_type)
        allowed_fields = [field["name"] for field in service["fields"]]
        logger.info("AI request started intent service=%s fields=%s", service_type, allowed_fields)

        client = self._get_client()
        if client is None:
            logger.warning("AI unavailable: GEMINI_API_KEY is not configured")
            return AIIntentResponse(
                intent="unknown",
                needs_clarification=True,
                fallback_to_client=True,
                clarification_question=(
                    "I couldn't understand that. Please tell me the field and value, "
                    "for example: My mobile number is 9876543210."
                ),
            )

        safe_data = {
            key: value
            for key, value in form_data.items()
            if key not in {"aadhaar", "permanentAddress", "presentAddress", "mobile", "email"}
        }
        prompt = self._build_prompt(
            service["title"],
            allowed_fields,
            language,
            current_field,
            safe_data,
            transcript,
            history[-6:],
        )

        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": AIIntentResponse,
                },
            )
            result = AIIntentResponse.model_validate_json(response.text)
        except (ValidationError, json.JSONDecodeError, AttributeError, ValueError) as exc:
            logger.exception("AI response validation failed: %s", exc)
            return AIIntentResponse(
                intent="unknown",
                needs_clarification=True,
                fallback_to_client=True,
                clarification_question=(
                    "I couldn't understand that. Please tell me the field and value."
                ),
            )
        except Exception as exc:
            logger.exception("AI request failed: %s", exc)
            return AIIntentResponse(
                intent="unknown",
                needs_clarification=True,
                fallback_to_client=True,
                clarification_question=(
                    "I couldn't connect to the AI service. Please try again or edit the form manually."
                ),
            )

        unknown_fields = {
    item.field
    for item in result.fields
} - set(allowed_fields)
        if unknown_fields or result.intent not in ALLOWED_INTENTS:
            logger.warning("AI response rejected unknown fields or intent fields=%s intent=%s", unknown_fields, result.intent)
            return AIIntentResponse(
                intent="unknown",
                needs_clarification=True,
                clarification_question="I found an unsupported form detail. Please tell me which field you want to change.",
            )

        logger.info(
    "AI response received intent=%s fields=%s",
    result.intent,
    [item.field for item in result.fields],
)
        return result

    @staticmethod
    def _build_prompt(
        title: str,
        allowed_fields: list[str],
        language: str,
        current_field: str | None,
        form_data: dict[str, Any],
        transcript: str,
        history: list[dict[str, str]],
    ) -> str:
        return f"""
You are the structured language-understanding layer for a government form assistant.
Return JSON only matching the requested schema. Never invent field names.

Form: {title}
Language: {language}
Allowed fields: {json.dumps(allowed_fields)}
Current field: {current_field or "none"}
Non-sensitive current values: {json.dumps(form_data, ensure_ascii=False)}
Recent conversation: {json.dumps(history, ensure_ascii=False)}
User transcript: {transcript}

Choose exactly one intent:
update_fields, correct_field, query_form_status, query_missing_fields,
repeat_question, next_field, previous_field, confirm, clarification, unknown.

Put only confidently extracted allowed field/value pairs in fields. For corrections use
correct_field. For vague input set needs_clarification true and provide clarification_question.
Do not validate values; deterministic application code validates them after extraction.
""".strip()


ai_service = AIService()
