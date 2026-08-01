from dataclasses import dataclass, field


@dataclass(slots=True)
class PromptContext:
    form_title: str
    field_label: str
    language: str = 'en'
    hints: list[str] = field(default_factory=list)


class PromptEngine:
    def build_field_prompt(self, context: PromptContext) -> str:
        hints = '; '.join(context.hints)
        hint_block = f' Helpful hints: {hints}.' if hints else ''
        return (
            f'You are assisting with {context.form_title}. '
            f'Ask for {context.field_label} in simple {context.language} language.'
            f'{hint_block}'
        )
