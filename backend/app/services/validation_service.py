import re
from datetime import datetime


DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
]


MOBILE_PATTERN = re.compile(
    r"^[6-9]\d{9}$"
)


def validate_date(value: str) -> bool:
    for fmt in DATE_FORMATS:
        try:
            datetime.strptime(
                value,
                fmt,
            )
            return True
        except ValueError:
            continue

    return False


def normalize_mobile(value: str) -> str:
    return (
        value
        .replace("+91", "")
        .replace(" ", "")
        .replace("-", "")
    )


def validate_field(
    field: str,
    value: str,
    required: bool = True,
) -> list[str]:

    errors: list[str] = []

    value = value.strip()

    if required and not value:
        errors.append(
            "This field is required."
        )
        return errors

    if not value:
        return errors

    if field == "fullName":
        if len(value.split()) < 2:
            errors.append(
                "Please enter your full name."
            )

    elif field == "dateOfBirth":
        if not validate_date(value):
            errors.append(
                "Use DD/MM/YYYY, DD-MM-YYYY or YYYY-MM-DD."
            )

    elif field == "mobile":
        mobile = normalize_mobile(value)

        if not MOBILE_PATTERN.fullmatch(
            mobile
        ):
            errors.append(
                "Please enter a valid 10-digit Indian mobile number."
            )

    elif field == "address":
        if len(value) < 8:
            errors.append(
                "Please provide a more complete address."
            )

    elif field == "annualIncome":
        cleaned = (
            value
            .replace(",", "")
            .replace("₹", "")
            .strip()
        )

        try:
            income = float(cleaned)

            if income < 0:
                errors.append(
                    "Income cannot be negative."
                )

        except ValueError:
            errors.append(
                "Please enter a valid annual income."
            )

    elif field == "age":
        try:
            age = int(value)

            if age < 0 or age > 120:
                errors.append(
                    "Please enter a valid age."
                )

        except ValueError:
            errors.append(
                "Age must be a number."
            )

    elif field in {
        "community",
        "placeOfBirth",
        "institution",
        "course",
        "purpose",
    }:
        if len(value) < 2:
            errors.append(
                "Please provide a valid value."
            )

    return errors


def validate_form(
    service_type: str,
    data: dict,
    required_fields: list[str],
) -> dict:

    errors: list[str] = []
    warnings: list[str] = []
    missing_fields: list[str] = []

    for field_name in required_fields:

        value = str(
            data.get(field_name, "")
        ).strip()

        if not value:
            missing_fields.append(
                field_name
            )
            continue

        field_errors = validate_field(
            field_name,
            value,
            required=True,
        )

        errors.extend(
            f"{field_name}: {error}"
            for error in field_errors
        )

    if service_type == "income_certificate":
        if "annualIncome" in data:
            warnings.append(
                "Verify the income amount before final confirmation."
            )

    return {
        "valid": (
            not errors
            and not missing_fields
        ),
        "errors": errors,
        "warnings": warnings,
        "missing_fields": missing_fields,
    }