import json
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.forms import (
    Application,
    ConversationMessage,
    ConversationSession,
)
from app.schemas.forms import (
    AIIntentResponse,
    ApplicationCreate,
    ConversationMessageRequest,
    ConversationStartRequest,
)
from app.services.forms_service import (
    calculate_progress,
    get_application,
    get_application_data,
    get_field_definition,
    get_next_field,
    get_required_fields,
    get_service,
)
from app.services.forms_service import create_application
from app.services.validation_service import (
    normalize_field_value,
    validate_field,
    validate_form,
)
from app.services.ai_service import ai_service


def add_message(
    db: Session,
    session: ConversationSession,
    role: str,
    content: str,
    field_name: str | None = None,
) -> ConversationMessage:

    message = ConversationMessage(
        session_id=session.id,
        role=role,
        content=content,
        field_name=field_name,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


def get_session(
    db: Session,
    session_id: str,
) -> ConversationSession | None:

    return db.scalar(
        select(ConversationSession).where(
            ConversationSession.session_id
            == session_id
        )
    )


def get_question(
    service_type: str,
    field_name: str | None,
    language: str,
) -> str:

    if field_name is None:
        return "Please review the application."

    field = get_field_definition(
        service_type,
        field_name,
    )

    if field is None:
        return (
            "Please provide the required information."
        )

    return field["question"].get(
        language,
        field["question"]["en"],
    )


def first_missing_field(
    application: Application,
) -> str | None:

    data = get_application_data(
        application
    )

    return get_next_field(
        application.service_type,
        data,
    )


def create_session(
    db: Session,
    payload: ConversationStartRequest,
) -> dict:

    application: Application | None = None

    if payload.application_id is not None:

        application = get_application(
            db,
            payload.application_id,
        )

        if application is None:
            raise ValueError(
                "Application not found."
            )

        if application.language != payload.language:
            application.language = (
                payload.language
            )

            db.commit()
            db.refresh(application)

    elif payload.service_type is not None:

        application = create_application(
            db,
            ApplicationCreate(
                service_type=payload.service_type,
                language=payload.language,
            ),
        )

        if payload.data:
            payload_data = _with_derived_values(
                payload.data
            )

            application.data_json = json.dumps(
                payload_data,
                ensure_ascii=False,
            )

            application.progress = calculate_progress(
                application.service_type,
                payload_data,
            )

            db.commit()
            db.refresh(application)

    else:
        raise ValueError(
            "Provide service_type or application_id."
        )

    session_id = str(
        uuid.uuid4()
    )

    current_field = first_missing_field(
        application
    )

    session = ConversationSession(
        session_id=session_id,
        application_id=application.id,
        language=payload.language,
        current_field=current_field,
        active=True,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    service = get_service(
        application.service_type
    )

    if current_field:

        question = get_question(
            application.service_type,
            current_field,
            payload.language,
        )

        message = (
            f"Great. We can start your "
            f"{service['title']} application. "
            f"{question}"
        )

        if payload.language == "ta":
            message = (
                f"{service['title']} விண்ணப்பத்தை "
                f"தொடங்கலாம். {question}"
            )

    else:

        message = (
            "All required information has already "
            "been collected. Please review the application."
        )

        session.active = False
        db.commit()

    add_message(
        db,
        session,
        "assistant",
        message,
        current_field,
    )

    return {
        "session_id": session.session_id,
        "application_id": application.id,
        "service_type": application.service_type,
        "language": session.language,
        "current_field": current_field,
        "assistant_message": message,
        "completed": current_field is None,
    }


def process_ai_message(
    db: Session,
    request: ConversationMessageRequest,
) -> dict:

    session = get_session(
        db,
        request.session_id,
    )

    if session is None:
        raise ValueError(
            "Conversation session not found."
        )

    application = get_application(
        db,
        session.application_id,
    )

    if application is None:
        raise ValueError(
            "Application not found."
        )

    transcript = request.message.strip()

    data = get_application_data(
        application
    )

    history = [
        {
            "role": item.role,
            "content": item.content,
        }
        for item in session.messages[-6:]
    ]

    add_message(
        db,
        session,
        "user",
        transcript,
        session.current_field,
    )

    result = ai_service.interpret(
        service_type=application.service_type,
        language=session.language,
        current_field=session.current_field,
        form_data=data,
        transcript=transcript,
        history=history,
    )

    # ========================================================
    # FORM STATUS
    # ========================================================

    if result.intent == "query_form_status":

        required = get_required_fields(
            application.service_type
        )

        missing = [
            field
            for field in required
            if not str(
                data.get(field, "")
            ).strip()
        ]

        response = (
            "Your form is complete."
            if not missing
            else
            f"Your form is missing "
            f"{len(missing)} required fields."
        )

        return _conversation_response(
            db,
            session,
            application,
            transcript,
            response,
            session.current_field,
            session.current_field,
            False,
            [],
        )

    # ========================================================
    # MISSING FIELDS
    # ========================================================

    if result.intent == "query_missing_fields":

        missing = _missing_labels(
            application.service_type,
            data,
        )

        response = (
            "All required fields are complete."
            if not missing
            else
            "The remaining fields are: "
            + ", ".join(missing)
            + "."
        )

        return _conversation_response(
            db,
            session,
            application,
            transcript,
            response,
            session.current_field,
            session.current_field,
            False,
            [],
        )

    # ========================================================
    # REPEAT QUESTION
    # ========================================================

    if result.intent == "repeat_question":

        response = get_question(
            application.service_type,
            session.current_field,
            session.language,
        )

        return _conversation_response(
            db,
            session,
            application,
            transcript,
            response,
            session.current_field,
            session.current_field,
            False,
            [],
        )

    # ========================================================
    # NEXT FIELD
    # ========================================================

    if result.intent == "next_field":

        next_field = _next_required_field(
            application.service_type,
            data,
            session.current_field,
        )

        session.current_field = next_field

        response = get_question(
            application.service_type,
            next_field,
            session.language,
        )

        db.commit()

        return _conversation_response(
            db,
            session,
            application,
            transcript,
            response,
            next_field,
            next_field,
            next_field is None,
            [],
        )

    # ========================================================
    # PREVIOUS FIELD
    # ========================================================

    if result.intent == "previous_field":

        previous_field = _previous_required_field(
            application.service_type,
            data,
            session.current_field,
        )

        session.current_field = previous_field

        response = get_question(
            application.service_type,
            previous_field,
            session.language,
        )

        db.commit()

        return _conversation_response(
            db,
            session,
            application,
            transcript,
            response,
            previous_field,
            previous_field,
            False,
            [],
        )

    # ========================================================
    # AI FALLBACK
    # ========================================================

    if result.fallback_to_client:

        response = (
            result.clarification_question
            or
            "I couldn't connect to the AI service. "
            "Please try again or edit the form manually."
        )

        return _conversation_response(
            db,
            session,
            application,
            transcript,
            response,
            session.current_field,
            session.current_field,
            False,
            [],
            fallback_to_client=True,
        )

    # ========================================================
    # CLARIFICATION / UNKNOWN
    # ========================================================

    if (
        result.needs_clarification
        or (
            result.intent in {
                "clarification",
                "unknown",
            }
            and not result.fields
        )
    ):

        if (
            session.current_field
            and result.intent == "unknown"
        ):
            result.fields = [
                {
                    "field": session.current_field,
                    "value": transcript,
                }
            ]

        else:

            response = (
                result.clarification_question
                or result.message
                or
                "I couldn't understand that. "
                "Please tell me the field and value."
            )

            return _conversation_response(
                db,
                session,
                application,
                transcript,
                response,
                session.current_field,
                session.current_field,
                False,
                [],
            )

    # ========================================================
    # EXTRACT AI FIELD UPDATES
    # ========================================================

    normalized: dict[str, str] = {}

    errors: list[str] = []

    for item in result.fields:

        field_name = item.field
        raw_value = item.value

        value = normalize_field_value(
            field_name,
            raw_value,
        )

        # Same-address handling
        if (
            field_name == "presentAddress"
            and value.casefold()
            in {
                "same",
                "same as permanent",
                "same as my permanent address",
            }
        ):

            value = str(
                data.get(
                    "permanentAddress",
                    "",
                )
            )

        normalized[field_name] = value

        field_errors = validate_field(
            field_name,
            value,
            required=True,
        )

        errors.extend(
            f"{field_name}: {error}"
            for error in field_errors
        )

    # ========================================================
    # VALIDATION FAILED
    # ========================================================

    if errors:

        first_field = (
            result.fields[0].field
            if result.fields
            else session.current_field
        )

        session.current_field = first_field

        response = errors[0].split(
            ": ",
            1,
        )[-1]

        return _conversation_response(
            db,
            session,
            application,
            transcript,
            response,
            first_field,
            first_field,
            False,
            errors,
        )

    # ========================================================
    # APPLY VALIDATED DATA
    # ========================================================

    data.update(
        normalized
    )

    response_fields = dict(normalized)

    # ========================================================
    # DERIVE AGE FROM DOB
    # ========================================================

    if "dateOfBirth" in normalized:

        try:
            data["age"] = _calculate_age(
                normalized["dateOfBirth"]
            )
            response_fields["age"] = data["age"]

        except ValueError:
            pass

    # ========================================================
    # CALCULATE TOTAL INCOME
    # ========================================================

    income_values = [
        data.get(name)
        for name in (
            "annualIncomeAgriculture",
            "annualIncomeSalary",
            "annualIncomeOther",
        )
    ]

    if all(
        str(value or "").strip()
        for value in income_values
    ):

        try:

            data["annualIncome"] = str(
                sum(
                    float(
                        str(value).replace(
                            ",",
                            "",
                        )
                    )
                    for value in income_values
                )
            )
            response_fields["annualIncome"] = data["annualIncome"]

        except ValueError:

            pass

    # ========================================================
    # SAVE APPLICATION
    # ========================================================

    application.data_json = json.dumps(
        data,
        ensure_ascii=False,
    )

    application.progress = calculate_progress(
        application.service_type,
        data,
    )

    application.status = "in_progress"

    # ========================================================
    # FIND NEXT REQUIRED FIELD
    # ========================================================

    next_field = get_next_field(
        application.service_type,
        data,
    )

    session.current_field = next_field

    completed = next_field is None

    if completed:

        application.status = "review"

        session.active = False

    # ========================================================
    # RESPONSE
    # ========================================================

    response = (
        result.message
        or _accepted_message(
            normalized,
            result.intent,
        )
    )

    if completed:

        response = (
            "All required information has been "
            "collected. Please review the application."
        )

    elif result.intent in {
        "update_fields",
        "correct_field",
    }:

        response = (
            f"{response} "
            f"{get_question(
                application.service_type,
                next_field,
                session.language,
            )}"
        )

    db.commit()

    return _conversation_response(
        db,
        session,
        application,
        transcript,
        response,
        next_field,
        next_field,
        completed,
        [],
        response_fields,
    )


def _conversation_response(
    db: Session,
    session: ConversationSession,
    application: Application,
    user_message: str,
    assistant_message: str,
    current_field: str | None,
    next_field: str | None,
    completed: bool,
    validation_errors: list[str],
    fields: dict[str, str] | None = None,
    fallback_to_client: bool = False,
) -> dict:

    add_message(
        db,
        session,
        "assistant",
        assistant_message,
        current_field,
    )

    return {
        "session_id": session.session_id,
        "application_id": application.id,
        "user_message": user_message,
        "assistant_message": assistant_message,
        "current_field": current_field,
        "next_field": next_field,
        "completed": completed,
        "validation_errors": validation_errors,
        "fields": fields or {},
        "fallback_to_client": fallback_to_client,
    }


def _missing_labels(
    service_type: str,
    data: dict,
) -> list[str]:

    service = get_service(
        service_type
    )

    return [
        field["label"]
        for field in service["fields"]
        if field["required"]
        and not str(
            data.get(
                field["name"],
                "",
            )
        ).strip()
    ]


def _next_required_field(
    service_type: str,
    data: dict,
    current_field: str | None,
) -> str | None:

    fields = get_required_fields(
        service_type
    )

    start = (
        fields.index(current_field) + 1
        if current_field in fields
        else 0
    )

    return next(
        (
            field
            for field in fields[start:]
            if not str(
                data.get(
                    field,
                    "",
                )
            ).strip()
        ),
        None,
    )


def _previous_required_field(
    service_type: str,
    data: dict,
    current_field: str | None,
) -> str | None:

    fields = get_required_fields(
        service_type
    )

    if current_field not in fields:

        return (
            fields[0]
            if fields
            else None
        )

    index = max(
        fields.index(current_field) - 1,
        0,
    )

    return fields[index]


def _calculate_age(
    value: str,
) -> str:

    from datetime import date

    birthday = datetime.strptime(
        value,
        "%Y-%m-%d",
    ).date()

    today = date.today()

    age = (
        today.year
        - birthday.year
        - (
            (today.month, today.day)
            < (birthday.month, birthday.day)
        )
    )

    return str(age)


def _with_derived_values(
    data: dict[str, object],
) -> dict[str, object]:

    result = dict(data)

    if result.get("dateOfBirth"):

        try:

            result["age"] = _calculate_age(
                str(
                    result["dateOfBirth"]
                )
            )

        except ValueError:

            pass

    income_names = (
        "annualIncomeAgriculture",
        "annualIncomeSalary",
        "annualIncomeOther",
    )

    if all(
        str(
            result.get(
                name,
                "",
            )
        ).strip()
        for name in income_names
    ):

        try:

            result["annualIncome"] = str(
                sum(
                    float(
                        str(
                            result[name]
                        ).replace(
                            ",",
                            "",
                        )
                    )
                    for name in income_names
                )
            )

        except ValueError:

            pass

    return result


def _accepted_message(
    fields: dict[str, str],
    intent: str,
) -> str:

    verb = (
        "changed"
        if intent == "correct_field"
        else "entered"
    )

    return " ".join(
        f"I've {verb} your {field} as {value}."
        for field, value in fields.items()
    )


def process_message(
    db: Session,
    request: ConversationMessageRequest,
) -> dict:

    session = get_session(
        db,
        request.session_id,
    )

    if session is None:
        raise ValueError(
            "Conversation session not found."
        )

    if not session.active:
        raise ValueError(
            "This conversation is no longer active."
        )

    application = get_application(
        db,
        session.application_id,
    )

    if application is None:
        raise ValueError(
            "Application not found."
        )

    message = request.message.strip()

    add_message(
        db,
        session,
        "user",
        message,
        session.current_field,
    )

    current_field = session.current_field

    if current_field is None:

        response = (
            "All required information has been "
            "collected. Please review the application "
            "before submission."
        )

        session.active = False

        db.commit()

        add_message(
            db,
            session,
            "assistant",
            response,
        )

        return {
            "session_id": session.session_id,
            "application_id": application.id,
            "user_message": message,
            "assistant_message": response,
            "current_field": None,
            "next_field": None,
            "completed": True,
            "validation_errors": [],
        }

    errors = validate_field(
        current_field,
        message,
        required=True,
    )

    if errors:

        question = get_question(
            application.service_type,
            current_field,
            session.language,
        )

        if session.language == "ta":

            response = (
                f"மன்னிக்கவும். {errors[0]} "
                f"மீண்டும் முயற்சிக்கவும். "
                f"{question}"
            )

        else:

            response = (
                f"I couldn't verify that. "
                f"{errors[0]} "
                f"Please try again. "
                f"{question}"
            )

        add_message(
            db,
            session,
            "assistant",
            response,
            current_field,
        )

        return {
            "session_id": session.session_id,
            "application_id": application.id,
            "user_message": message,
            "assistant_message": response,
            "current_field": current_field,
            "next_field": current_field,
            "completed": False,
            "validation_errors": errors,
        }

    data = get_application_data(
        application
    )

    data[current_field] = message

    application.data_json = json.dumps(
        data,
        ensure_ascii=False,
    )

    application.progress = calculate_progress(
        application.service_type,
        data,
    )

    next_field = get_next_field(
        application.service_type,
        data,
    )

    if next_field is None:

        application.status = "review"

        session.current_field = None
        session.active = False

        response = (
            "Thank you. I have collected all required "
            "information. Your application is ready "
            "for review. Please verify everything "
            "before confirming."
        )

        if session.language == "ta":

            response = (
                "நன்றி. தேவையான அனைத்து தகவல்களும் "
                "சேகரிக்கப்பட்டுவிட்டன. உங்கள் "
                "விண்ணப்பம் சரிபார்ப்புக்கு "
                "தயாராக உள்ளது."
            )

        add_message(
            db,
            session,
            "assistant",
            response,
        )

        db.commit()

        return {
            "session_id": session.session_id,
            "application_id": application.id,
            "user_message": message,
            "assistant_message": response,
            "current_field": None,
            "next_field": None,
            "completed": True,
            "validation_errors": [],
        }

    application.status = "in_progress"

    session.current_field = next_field

    question = get_question(
        application.service_type,
        next_field,
        session.language,
    )

    response = (
        f"Got it. {question}"
    )

    add_message(
        db,
        session,
        "assistant",
        response,
        next_field,
    )

    db.commit()

    return {
        "session_id": session.session_id,
        "application_id": application.id,
        "user_message": message,
        "assistant_message": response,
        "current_field": next_field,
        "next_field": next_field,
        "completed": False,
        "validation_errors": [],
    }


def get_conversation_history(
    db: Session,
    session_id: str,
) -> list[dict]:

    session = get_session(
        db,
        session_id,
    )

    if session is None:
        raise ValueError(
            "Conversation session not found."
        )

    return [
        {
            "role": message.role,
            "content": message.content,
            "field_name": message.field_name,
            "created_at": message.created_at,
        }
        for message in session.messages
    ]