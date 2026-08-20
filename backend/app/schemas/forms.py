from datetime import datetime
from typing import Any
from typing import Literal

from pydantic import BaseModel
from pydantic import Field


ServiceType = Literal[
    "income_certificate",
    "community_certificate",
    "nativity_certificate",
    "scholarship_application",
    "pension_application",
]

Language = Literal[
    "en",
    "ta",
]

ApplicationStatus = Literal[
    "draft",
    "in_progress",
    "review",
    "confirmed",
    "submitted",
]


class ApplicationCreate(BaseModel):
    service_type: ServiceType
    language: Language = "en"


class ApplicationUpdate(BaseModel):
    language: Language | None = None

    data: dict[str, Any] | None = None


class ApplicationResponse(BaseModel):
    id: int
    service_type: str
    service_title: str
    language: str
    status: str
    progress: int
    data: dict[str, Any]
    created_at: datetime
    updated_at: datetime | None = None
    confirmed_at: datetime | None = None

    model_config = {
        "from_attributes": True,
    }


class ConversationStartRequest(BaseModel):
    service_type: ServiceType | None = None
    language: Language = "en"
    application_id: int | None = None


class ConversationMessageRequest(BaseModel):
    session_id: str = Field(
        min_length=1,
        max_length=100,
    )

    message: str = Field(
        min_length=1,
        max_length=5000,
    )


class ConversationMessageResponse(BaseModel):
    session_id: str
    application_id: int

    user_message: str
    assistant_message: str

    current_field: str | None = None
    next_field: str | None = None

    completed: bool = False

    validation_errors: list[str] = Field(
        default_factory=list
    )


class ValidationRequest(BaseModel):
    service_type: ServiceType
    data: dict[str, Any]


class FieldValidationRequest(BaseModel):
    field: str
    value: str
    required: bool = True


class ValidationResponse(BaseModel):
    valid: bool

    errors: list[str] = Field(
        default_factory=list
    )

    warnings: list[str] = Field(
        default_factory=list
    )

    missing_fields: list[str] = Field(
        default_factory=list
    )