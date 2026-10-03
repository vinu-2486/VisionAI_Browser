from openai import OpenAI

from config import GROQ_API_KEY, GROQ_MODEL


class LLMClient:

    def __init__(self):
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not configured")

        self.client = OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
        self.model = GROQ_MODEL

    def generate_response(self, prompt):

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
        )

        return response.choices[0].message.content or ""

    def extract_field(self, prompt):

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Return valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )

        return response.choices[0].message.content or ""