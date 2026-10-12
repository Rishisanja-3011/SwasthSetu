from google import genai

from app.core.config import settings
from app.prompts.medical_prompt import MEDICAL_SYSTEM_PROMPT
from app.utils.text_formatter import clean_response


class GeminiService:

    def __init__(self):
        self.client = genai.Client(
            api_key=settings.gemini_api_key
        )

    def generate_response(
        self,
        question: str,
        history: list
    ):

        conversation_text = ""

        for message in history:
            if message["role"] == "user":
                conversation_text += (
                    f"User: {message['content']}\n"
                )

            elif message["role"] == "assistant":
                conversation_text += (
                    f"Assistant: {message['content']}\n"
                )

        full_prompt = f"""
{MEDICAL_SYSTEM_PROMPT}

Previous Conversation:
{conversation_text}

Use the previous conversation to understand the
context of the user's latest question.

If the user uses words such as "it", "this", "that",
"they", "them", or similar references, determine
what they refer to from the previous conversation.

Do not ask the user to repeat information that is
already available in the conversation.

Latest User Question:
{question}

Answer the latest question directly and concisely.
"""

        response = self.client.models.generate_content(
            model="gemini-flash-latest",
            contents=full_prompt
        )

        answer = clean_response(response.text)

        return answer


gemini_service = GeminiService()