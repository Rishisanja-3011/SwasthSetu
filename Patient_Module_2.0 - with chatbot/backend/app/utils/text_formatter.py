import re


def clean_response(text: str) -> str:
    """
    Cleans Gemini response before sending it to frontend.
    """

    if not text:
        return ""

    # Remove excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Remove trailing spaces
    text = re.sub(r"[ \t]+", " ", text)

    # Strip beginning/end whitespace
    text = text.strip()

    return text