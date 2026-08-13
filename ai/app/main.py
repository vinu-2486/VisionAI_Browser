from app.llm.client import LLMClient
from app.llm.prompt_engine import build_field_prompt


def main():

    llm = LLMClient()

    field = "Full Name"

    user_response = input("You: ")

    prompt = build_field_prompt(field, user_response)

    result = llm.extract_field(prompt)

    print("\nExtracted information:")
    print(result)


if __name__ == "__main__":
    main()