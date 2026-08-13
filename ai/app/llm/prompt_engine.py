from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

SYSTEM_PROMPT_PATH = BASE_DIR / "prompts" / "system_prompt.txt"
FIELD_PROMPT_PATH = BASE_DIR / "prompts" / "field_prompt.txt"


def load_system_prompt():
    return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")


def load_field_prompt():
    return FIELD_PROMPT_PATH.read_text(encoding="utf-8")


def build_field_prompt(field, user_response):

    prompt = load_field_prompt()

    return f"""
{prompt}

Detected form field:
{field}

User response:
{user_response}
"""