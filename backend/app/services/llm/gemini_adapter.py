"""Gemini adapter — wraps google.genai for text generation."""

from google import genai

_MODEL = "gemini-2.5-flash"


class GeminiClient:
    def __init__(self, api_key: str) -> None:
        self._client = genai.Client(api_key=api_key)

    def chat(self, prompt: str) -> str:
        response = self._client.models.generate_content(
            model=_MODEL, contents=prompt
        )
        return response.text
