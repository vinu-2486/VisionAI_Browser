from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.forms import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
)
from app.services.forms_service import (
    SERVICE_DEFINITIONS,
    create_application,
    get_application,
    get_applications,
    get_required_fields,
    get_service,
    serialize_application,
    update_application,
)
from app.services.validation_service import (
    validate_form,
)


router = APIRouter(
    prefix="/forms",
    tags=["Forms"],
)


@router.get("/services")
def available_services():

    return [
        {
            "id": service_id,
            "title": service["title"],
            "fields": [
                {
                    "name": field["name"],
                    "label": field["label"],
                    "required": field["required"],
                }
                for field in service["fields"]
            ],
        }
        for service_id, service
        in SERVICE_DEFINITIONS.items()
    ]


@router.get("/services/{service_type}")
def service_details(
    service_type: str,
):

    try:
        service = get_service(
            service_type
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return {
        "id": service_type,
        "title": service["title"],
        "fields": service["fields"],
    }


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=201,
)
def create_form(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
):

    application = create_application(
        db,
        payload,
    )

    return serialize_application(
        application
    )


@router.get(
    "",
    response_model=list[ApplicationResponse],
)
def list_forms(
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
):

    applications = get_applications(
        db,
        limit,
    )

    return [
        serialize_application(application)
        for application in applications
    ]


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
)
def get_form(
    application_id: int,
    db: Session = Depends(get_db),
):

    application = get_application(
        db,
        application_id,
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    return serialize_application(
        application
    )


@router.patch(
    "/{application_id}",
    response_model=ApplicationResponse,
)
def update_form(
    application_id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
):

    application = get_application(
        db,
        application_id,
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    try:
        updated = update_application(
            db,
            application,
            payload,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return serialize_application(
        updated
    )


@router.post(
    "/{application_id}/review",
    response_model=ApplicationResponse,
)
def move_to_review(
    application_id: int,
    db: Session = Depends(get_db),
):

    application = get_application(
        db,
        application_id,
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    required_fields = get_required_fields(
        application.service_type
    )

    from app.services.forms_service import (
        get_application_data,
    )

    result = validate_form(
        application.service_type,
        get_application_data(application),
        required_fields,
    )

    if not result["valid"]:
        raise HTTPException(
            status_code=400,
            detail=result,
        )

    application.status = "review"
    application.progress = 100

    db.commit()
    db.refresh(application)

    return serialize_application(
        application
    )


@router.post(
    "/{application_id}/confirm",
    response_model=ApplicationResponse,
)
def confirm_application(
    application_id: int,
    db: Session = Depends(get_db),
):

    application = get_application(
        db,
        application_id,
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    if application.progress < 100:
        raise HTTPException(
            status_code=400,
            detail=(
                "Application is incomplete."
            ),
        )

    if application.status != "review":
        raise HTTPException(
            status_code=400,
            detail=(
                "Application must be in review "
                "status before confirmation."
            ),
        )

    application.status = "confirmed"

    application.confirmed_at = (
        datetime.now(timezone.utc)
    )

    db.commit()
    db.refresh(application)

    return serialize_application(
        application
    )


@router.post(
    "/{application_id}/submit",
    response_model=ApplicationResponse,
)
def submit_form(
    application_id: int,
    db: Session = Depends(get_db),
):

    application = get_application(
        db,
        application_id,
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    if application.progress < 100:
        raise HTTPException(
            status_code=400,
            detail=(
                "Application cannot be submitted "
                "until all required information is complete."
            ),
        )

    if application.status != "confirmed":
        raise HTTPException(
            status_code=400,
            detail=(
                "User confirmation is required "
                "before submission."
            ),
        )

    application.status = "submitted"

    db.commit()
    db.refresh(application)

    return serialize_application(
        application
    )


@router.delete(
    "/{application_id}",
)
def delete_form(
    application_id: int,
    db: Session = Depends(get_db),
):

    application = get_application(
        db,
        application_id,
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    db.delete(application)
    db.commit()

    return {
        "success": True,
        "message": "Application deleted.",
    }