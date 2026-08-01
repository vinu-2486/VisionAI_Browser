from pydantic import BaseModel, Field


class FormFieldSchema(BaseModel):
    key: str
    label: str
    field_type: str
    required: bool = True
    help_text: str = ''
    options: list[str] = Field(default_factory=list)


class FormTemplateSchema(BaseModel):
    form_id: str
    title: str
    description: str
    fields: list[FormFieldSchema]


class ConversationRequest(BaseModel):
    form_id: str
    current_field: str | None = None
    answers: dict[str, str] = Field(default_factory=dict)
    language: str = 'en'


class ConversationResponse(BaseModel):
    next_question: str
    current_field: str | None = None
    explanation: str = ''
    suggestions: list[str] = Field(default_factory=list)


class ValidationRequest(BaseModel):
    field_key: str
    field_type: str
    value: str
    required: bool = True


class ValidationResponse(BaseModel):
    valid: bool
    message: str
