from google import genai
from config import GEMINI_API_KEY, GEMINI_MODEL


class LLMClient:

    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model = GEMINI_MODEL

    def generate_response(self, prompt):

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )

        return response.text

    def extract_field(self, prompt):

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config={
                "response_mime_type": "application/json"
            }
        )

        return response.text