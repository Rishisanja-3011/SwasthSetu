from groq import Groq

from app.core.config import settings
from app.prompts.medical_prompt import MEDICAL_SYSTEM_PROMPT
from app.utils.text_formatter import clean_response


class GroqService:

    def __init__(self):
        self.client = Groq(
            api_key=settings.groq_api_key
        )

    def generate_response(
        self,
        question: str,
        history: list
    ):

        messages = [
            {
                "role": "system",
                "content": MEDICAL_SYSTEM_PROMPT
            }
        ]

        # Add previous conversation
        for message in history:
            messages.append({
                "role": message["role"],
                "content": message["content"]
            })

        # Add latest question
        messages.append({
            "role": "user",
            "content": question
        })

        response = self.client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            temperature=0.3,
            max_tokens=500,
        )

        answer = clean_response(
            response.choices[0].message.content
        )

        return answer


groq_service = GroqService()