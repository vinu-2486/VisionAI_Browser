from app.models.forms import FormField, FormTemplate

SUPPORTED_FORMS: dict[str, FormTemplate] = {
    'income_certificate': FormTemplate(
        form_id='income_certificate',
        title='Income Certificate Application',
        description='Prototype template for income certificate requests.',
        fields=[
            FormField('full_name', 'Full name', 'text', True, 'Enter the name exactly as in official records.'),
            FormField('date_of_birth', 'Date of birth', 'date', True, 'Use DD-MM-YYYY format if the page accepts free text.'),
            FormField('address', 'Address', 'textarea', True, 'Include house, street, village, and district.'),
            FormField('mobile_number', 'Mobile number', 'tel', True, 'Use the active phone number for verification.'),
        ],
    ),
    'community_certificate': FormTemplate(
        form_id='community_certificate',
        title='Community Certificate Application',
        description='Prototype template for community certificate requests.',
        fields=[
            FormField('full_name', 'Full name', 'text', True),
            FormField('community', 'Community', 'select', True, options=['SC', 'ST', 'OBC', 'MBC', 'General']),
            FormField('address', 'Address', 'textarea', True),
        ],
    ),
}


def list_supported_forms() -> list[FormTemplate]:
    return list(SUPPORTED_FORMS.values())


def get_form(form_id: str) -> FormTemplate | None:
    return SUPPORTED_FORMS.get(form_id)
