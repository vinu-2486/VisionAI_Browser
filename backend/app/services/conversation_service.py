from app.models.forms import FormField, FormTemplate


class ConversationService:
    def next_question(self, template: FormTemplate, current_field_key: str | None, answers: dict[str, str]) -> dict[str, object]:
        fields = template.fields
        next_field = None

        if current_field_key:
            for index, field in enumerate(fields):
                if field.key == current_field_key:
                    next_index = index + 1
                    if next_index < len(fields):
                        next_field = fields[next_index]
                    break
        else:
            next_field = fields[0] if fields else None

        if next_field is None:
            return {
                'next_question': 'All required fields are collected. Please review the summary before submission.',
                'current_field': None,
                'explanation': 'The assistant has no additional required questions for this template.',
                'suggestions': ['Review summary', 'Submit form', 'Edit answer'],
            }

        return {
            'next_question': self._build_question(next_field, answers),
            'current_field': next_field.key,
            'explanation': next_field.help_text or f'Please provide the value for {next_field.label}.',
            'suggestions': self._build_suggestions(next_field),
        }

    def _build_question(self, field: FormField, answers: dict[str, str]) -> str:
        if field.key in answers and answers[field.key]:
            return f'You already answered {field.label}. Would you like to confirm or change it?'

        if field.field_type == 'date':
            return f'What is your {field.label.lower()}? Please say it clearly in day, month, and year.'
        if field.field_type == 'select' and field.options:
            joined = ', '.join(field.options)
            return f'What is your {field.label.lower()}? You can choose from: {joined}.'
        return f'What is your {field.label.lower()}?'

    def _build_suggestions(self, field: FormField) -> list[str]:
        if field.options:
            return field.options[:3]
        return ['Repeat question', 'Explain field', 'Confirm answer']
