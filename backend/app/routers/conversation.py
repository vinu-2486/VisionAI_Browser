from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.forms import (
    ConversationMessageRequest,
    ConversationStartRequest,
)
from app.services.conversation_service import (
    create_session,
    get_conversation_history,
    process_message,
)


router = APIRouter(
    prefix="/conversation",
    tags=["Conversation"],
)


@router.post("/start")
def start_conversation(
    payload: ConversationStartRequest,
    db: Session = Depends(get_db),
):

    try:
        return create_session(
            db,
            payload,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post("/message")
def send_message(
    payload: ConversationMessageRequest,
    db: Session = Depends(get_db),
):

    try:
        return process_message(
            db,
            payload,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.get(
    "/{session_id}/history"
)
def conversation_history(
    session_id: str,
    db: Session = Depends(get_db),
):

    try:
        return {
            "session_id": session_id,
            "messages": get_conversation_history(
                db,
                session_id,
            ),
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc