from groq import Groq

from app.core.config import settings


client = Groq(
    api_key=settings.groq_api_key
)


response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
            "role": "system",
            "content": (
                "You are a medical education assistant. "
                "Give simple, concise educational answers. "
                "Do not prescribe medicines or dosages."
            ),
        },
        {
            "role": "user",
            "content": "What is hemoglobin? Answer in one short paragraph.",
        },
    ],
    temperature=0.3,
    max_tokens=200,
)


print("\nGroq response:\n")
print(response.choices[0].message.content)