import re
from datetime import datetime


DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%d %B %Y",
    "%d %b %Y",
]


MOBILE_PATTERN = re.compile(
    r"^[6-9]\d{9}$"
)

EMAIL_PATTERN = re.compile(
    r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
)

TAMIL_NADU_CITIES = {
    "Chennai",
    "Madurai",
    "Coimbatore",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Erode",
    "Vellore",
    "Thoothukudi",
    "Thanjavur",
}

PURPOSE_OPTIONS = {
    "Education",
    "Scholarship",
    "Government Benefit",
}


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


def normalize_digits(value: str) -> str:
    number_words = {
        "zero": "0",
        "oh": "0",
        "one": "1",
        "two": "2",
        "three": "3",
        "four": "4",
        "five": "5",
        "six": "6",
        "seven": "7",
        "eight": "8",
        "nine": "9",
    }
    text = value.lower().replace("-", " ").replace(",", " ")
    if re.search(r"\d", text):
        return re.sub(r"\D", "", text)
    return "".join(number_words.get(part, "") for part in text.split())


def normalize_email(value: str) -> str:
    normalized = value.strip().lower()
    normalized = re.sub(r"\s+at\s+the\s+rate\s+", "@", normalized)
    normalized = re.sub(r"\s+at\s+", "@", normalized)
    normalized = re.sub(r"\s+(?:dot|period)\s+", ".", normalized)
    normalized = re.sub(r"\s+(?:underscore|under\s+score)\s+", "_", normalized)
    normalized = re.sub(r"\s+(?:hyphen|dash)\s+", "-", normalized)
    return re.sub(r"\s+", "", normalized)


def normalize_income(value: str) -> str:
    text = value.strip().lower().replace(",", "")
    units = {
        "crore": 10_000_000,
        "crores": 10_000_000,
        "cr": 10_000_000,
        "lakh": 100_000,
        "lakhs": 100_000,
        "lac": 100_000,
        "lacs": 100_000,
        "thousand": 1_000,
        "thousands": 1_000,
        "k": 1_000,
    }
    match = re.fullmatch(
        r"(\d+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|lac|thousands?|k)?",
        text,
    )
    if not match:
        return value.strip()
    amount = float(match.group(1))
    multiplier = units.get(match.group(2) or "", 1)
    result = amount * multiplier
    return str(int(result) if result.is_integer() else result)


def normalize_field_value(field: str, value: str) -> str:
    if field == "mobile":
        return normalize_mobile(value)
    if field in {"aadhaar", "pin"}:
        return normalize_digits(value)
    if field == "email":
        return normalize_email(value)
    if field == "dateOfBirth":
        normalized = value.strip().replace(",", "")
        extra_digit = re.fullmatch(
            r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{5})",
            normalized,
        )
        if extra_digit:
            normalized = (
                f"{extra_digit.group(1)} "
                f"{extra_digit.group(2)} "
                f"{extra_digit.group(3)[:4]}"
            )
        for fmt in DATE_FORMATS:
            try:
                return datetime.strptime(normalized, fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
        return normalized
    if field in {
        "annualIncome",
        "annualIncomeAgriculture",
        "annualIncomeSalary",
        "annualIncomeOther",
    }:
        return normalize_income(value)
    if field == "state" and value.strip().casefold() == "tamil nadu":
        return "Tamil Nadu"
    if field == "gender":
        gender_values = {
            "male": "Male",
            "man": "Male",
            "boy": "Male",
            "female": "Female",
            "woman": "Female",
            "girl": "Female",
            "transgender": "Transgender",
            "prefer not to say": "Prefer not to say",
        }
        return gender_values.get(value.strip().casefold(), value.strip())
    if field == "maritalStatus":
        marital_values = {
            "single": "Single",
            "unmarried": "Single",
            "married": "Married",
            "widowed": "Widowed",
            "divorced": "Divorced",
        }
        return marital_values.get(value.strip().casefold(), value.strip())
    if field == "purpose":
        purpose_values = {
            "education": "Education",
            "educational": "Education",
            "scholarship": "Scholarship",
            "government benefit": "Government Benefit",
            "government scheme": "Government Benefit",
            "government assistance": "Government Benefit",
        }
        normalized = value.strip().casefold()
        if "education" in normalized:
            return "Education"
        if "scholarship" in normalized:
            return "Scholarship"
        if (
            ("government" in normalized or "govt" in normalized)
            and any(word in normalized for word in ("benefit", "scheme", "assistance"))
        ):
            return "Government Benefit"
        return purpose_values.get(normalized, value.strip())
    for city in TAMIL_NADU_CITIES:
        if field == "city" and city.casefold() == value.strip().casefold():
            return city
    return value.strip()


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
        if not re.fullmatch(r"[\w\s.'-]+", value, flags=re.UNICODE):
            errors.append(
                "Please enter a name using letters only."
            )

    elif field == "dateOfBirth":
        if not validate_date(value):
            errors.append(
                "Use DD/MM/YYYY, DD-MM-YYYY or YYYY-MM-DD."
            )
        elif datetime.strptime(value, next(
            fmt for fmt in DATE_FORMATS
            if _matches_date_format(value, fmt)
        )).date() > datetime.now().date():
            errors.append(
                "Date of birth cannot be in the future."
            )

    elif field == "mobile":
        mobile = normalize_mobile(value)

        if not MOBILE_PATTERN.fullmatch(
            mobile
        ):
            errors.append(
                "Please enter a valid 10-digit Indian mobile number."
            )

    elif field == "email":
        if not EMAIL_PATTERN.fullmatch(value):
            errors.append(
                "Please enter a valid email address."
            )

    elif field == "state":
        if value.casefold() != "tamil nadu":
            errors.append(
                "For now, only Tamil Nadu is supported."
            )

    elif field == "city":
        if value not in TAMIL_NADU_CITIES:
            errors.append(
                "Please choose a supported Tamil Nadu city."
            )

    elif field == "purpose":
        if value not in PURPOSE_OPTIONS:
            errors.append(
                "Choose Education, Scholarship, or Government Benefit."
            )

    elif field in {"aadhaar", "pin"}:
        digits = re.sub(r"\D", "", value)
        expected = 12 if field == "aadhaar" else 6
        if len(digits) != expected:
            errors.append(
                f"Please enter a valid {expected}-digit number."
            )

    elif field in {"address", "permanentAddress", "presentAddress"}:
        if len(value) < 8:
            errors.append(
                "Please provide a more complete address."
            )

    elif field in {
        "annualIncome",
        "annualIncomeAgriculture",
        "annualIncomeSalary",
        "annualIncomeOther",
    }:
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
        "gender",
        "maritalStatus",
        "religion",
        "fatherName",
        "motherName",
        "policeStation",
        "postOffice",
        "district",
        "declarationName",
    }:
        if len(value) < 2:
            errors.append(
                "Please provide a valid value."
            )

    return errors


def _matches_date_format(value: str, fmt: str) -> bool:
    try:
        datetime.strptime(value, fmt)
        return True
    except ValueError:
        return False


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