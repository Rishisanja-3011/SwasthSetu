from groq import Groq

from app.core.config import settings
from app.prompts.medical_prompt import MEDICAL_SYSTEM_PROMPT
from app.utils.text_formatter import clean_response


class GroqService:
    def __init__(self):
        self.client = None

    def _client(self):
        if self.client is None:
            if not settings.groq_api_key:
                raise RuntimeError("MediBot AI provider is not configured.")
            self.client = Groq(api_key=settings.groq_api_key)
        return self.client

    def generate_response(self, question: str, history: list):
        messages = [{"role": "system", "content": MEDICAL_SYSTEM_PROMPT}]
        for message in history:
            if message.get("role") in {"user", "assistant"}:
                messages.append({
                    "role": message["role"],
                    "content": message.get("content", ""),
                })
        messages.append({"role": "user", "content": question})

        response = self._client().chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            temperature=0.3,
            max_tokens=500,
        )
        answer = clean_response(response.choices[0].message.content)
        if not answer:
            raise RuntimeError("MediBot returned an empty response.")
        return answer


groq_service = GroqService()
