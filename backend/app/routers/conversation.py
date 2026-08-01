from fastapi import APIRouter, HTTPException

from app.schemas.forms import ConversationRequest, ConversationResponse, FormTemplateSchema
from app.services.conversation_service import ConversationService
from app.services.forms_service import get_form

router = APIRouter(prefix='/conversation', tags=['conversation'])
service = ConversationService()


@router.post('/next', response_model=ConversationResponse)
def next_question(request: ConversationRequest) -> ConversationResponse:
    template = get_form(request.form_id)
    if template is None:
        raise HTTPException(status_code=404, detail='Form template not found')

    result = service.next_question(template, request.current_field, request.answers)
    return ConversationResponse(**result)
