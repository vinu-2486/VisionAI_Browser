from fastapi import APIRouter
from fastapi import HTTPException

from app.schemas.forms import (
    FieldValidationRequest,
    ValidationRequest,
    ValidationResponse,
)
from app.services.forms_service import (
    get_required_fields,
)
from app.services.validation_service import (
    validate_field,
    validate_form,
)


router = APIRouter(
    prefix="/validation",
    tags=["Validation"],
)


@router.post("/field")
def validate_single_field(
    payload: FieldValidationRequest,
):

    errors = validate_field(
        payload.field,
        payload.value,
        payload.required,
    )

    return {
        "valid": not errors,
        "errors": errors,
    }


@router.post(
    "/form",
    response_model=ValidationResponse,
)
def validate_application(
    payload: ValidationRequest,
):

    try:
        required_fields = get_required_fields(
            payload.service_type
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return validate_form(
        payload.service_type,
        payload.data,
        required_fields,
    )