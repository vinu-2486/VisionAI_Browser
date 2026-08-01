import re


def normalize_phone_number(value: str) -> str:
    return re.sub(r'\s+', '', value.strip())


def looks_like_date(value: str) -> bool:
    return bool(re.fullmatch(r'\d{2}-\d{2}-\d{4}', value.strip()))


def is_non_empty(value: str) -> bool:
    return bool(value.strip())
