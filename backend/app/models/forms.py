from dataclasses import dataclass, field


@dataclass(slots=True)
class FormField:
    key: str
    label: str
    field_type: str
    required: bool = True
    help_text: str = ''
    options: list[str] = field(default_factory=list)


@dataclass(slots=True)
class FormTemplate:
    form_id: str
    title: str
    description: str
    fields: list[FormField]
