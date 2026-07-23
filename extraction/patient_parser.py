import re


def extract_patient_context(cleaned_text: str) -> dict:
    """
    Extract patient context required for later
    blood-report interpretation.

    Currently supported:
    - Age
    - Sex

    Example supported format:

        Age / Gender
        : 34 Years/Male

    The text is flattened before matching because PDF
    extraction may place the label and value on
    separate lines.
    """

    patient = {
        "age": None,
        "sex": None
    }

    # -----------------------------------------------------
    # Flatten text
    # -----------------------------------------------------

    searchable_text = " ".join(
        cleaned_text.splitlines()
    )

    # -----------------------------------------------------
    # AGE + SEX
    #
    # Example:
    #
    # Age / Gender : 34 Years/Male
    # -----------------------------------------------------

    pattern = re.compile(
        r"Age\s*/\s*Gender\s*:?\s*"
        r"(\d+)\s*Years?\s*/\s*"
        r"(Male|Female)",
        re.IGNORECASE
    )

    match = pattern.search(
        searchable_text
    )

    if match:

        patient["age"] = int(
            match.group(1)
        )

        patient["sex"] = (
            match.group(2)
            .strip()
            .lower()
        )

    return patient