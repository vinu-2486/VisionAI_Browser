from fastapi import APIRouter, HTTPException

from app.schemas.forms import FormFieldSchema
from app.schemas.forms import FormTemplateSchema
from app.services.forms_service import get_form, list_supported_forms

router = APIRouter(prefix='/forms', tags=['forms'])


@router.get('', response_model=list[FormTemplateSchema])
def get_forms() -> list[FormTemplateSchema]:
    templates: list[FormTemplateSchema] = []
    for template in list_supported_forms():
        templates.append(
            FormTemplateSchema(
                form_id=template.form_id,
                title=template.title,
                description=template.description,
                fields=[FormFieldSchema.model_validate(field.__dict__) for field in template.fields],
            )
        )
    return templates


@router.get('/{form_id}', response_model=FormTemplateSchema)
def get_form_by_id(form_id: str) -> FormTemplateSchema:
    template = get_form(form_id)
    if template is None:
        raise HTTPException(status_code=404, detail='Form template not found')
    return FormTemplateSchema(
        form_id=template.form_id,
        title=template.title,
        description=template.description,
        fields=[FormFieldSchema.model_validate(field.__dict__) for field in template.fields],
    )
