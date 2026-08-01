from fastapi import APIRouter

from app.schemas.forms import ValidationRequest, ValidationResponse
from app.services.validation_service import ValidationService

router = APIRouter(prefix='/validation', tags=['validation'])
service = ValidationService()


@router.post('/check', response_model=ValidationResponse)
def validate_value(request: ValidationRequest) -> ValidationResponse:
    result = service.validate(request.field_key, request.field_type, request.value, request.required)
    return ValidationResponse(**result)
