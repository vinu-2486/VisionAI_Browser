import json
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.forms import (
    Application,
    ConversationMessage,
    ConversationSession,
)
from app.schemas.forms import (
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
    validate_field,
)


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
    field_name: str,
    language: str,
) -> str:

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
            "All required information has been collected. "
            "Please review the application before submission."
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
                f"மீண்டும் முயற்சிக்கவும். {question}"
            )
        else:
            response = (
                f"I couldn't verify that. "
                f"{errors[0]} "
                f"Please try again. {question}"
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
                "விண்ணப்பம் சரிபார்ப்புக்கு தயாராக உள்ளது."
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