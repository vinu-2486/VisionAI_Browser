import re


class ValidationService:
    def validate(self, field_key: str, field_type: str, value: str, required: bool = True) -> dict[str, object]:
        trimmed_value = value.strip()

        if required and not trimmed_value:
            return {'valid': False, 'message': f'{field_key} is required.'}

        if field_type == 'date' and trimmed_value and not re.fullmatch(r'\d{2}-\d{2}-\d{4}', trimmed_value):
            return {'valid': False, 'message': 'Use DD-MM-YYYY format for the date.'}

        if field_type == 'tel' and trimmed_value and not re.fullmatch(r'[+]?[0-9]{10,13}', trimmed_value.replace(' ', '')):
            return {'valid': False, 'message': 'Enter a valid phone number.'}

        return {'valid': True, 'message': f'{field_key} looks valid.'}
