import re
from typing import Optional


# =========================================================
# RESULT HELPERS
# =========================================================

def unresolved(reason: str) -> dict:
    """
    Standard unresolved response.

    IMPORTANT:
    The resolver never guesses a reference interval.
    """

    return {
        "resolved": False,
        "min": None,
        "max": None,
        "matched_by": None,
        "matched_age": None,
        "matched_sex": None,
        "source": "laboratory_report",
        "reason": reason
    }


def resolved(
    minimum: float,
    maximum: float,
    matched_by: str,
    age: Optional[int] = None,
    sex: Optional[str] = None
) -> dict:

    return {
        "resolved": True,
        "min": float(minimum),
        "max": float(maximum),
        "matched_by": matched_by,
        "matched_age": age,
        "matched_sex": sex,
        "source": "laboratory_report",
        "reason": None
    }


# =========================================================
# TEXT NORMALIZATION
# =========================================================

def normalize_reference_text(
    reference_raw
) -> str:
    """
    Normalize extracted reference-range text without
    changing its medical meaning.
    """

    if reference_raw is None:
        return ""

    text = str(reference_raw)

    # Normalize common dash characters.
    text = text.replace("–", "-")
    text = text.replace("—", "-")

    # Normalize line endings.
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Remove square brackets.
    text = text.replace("[", "")
    text = text.replace("]", "")

    # Normalize repeated spaces, but preserve newlines.
    lines = []

    for line in text.splitlines():

        line = re.sub(
            r"[ \t]+",
            " ",
            line
        ).strip()

        if line:
            lines.append(line)

    return "\n".join(lines)


# =========================================================
# BASIC RANGE PARSER
# =========================================================

def parse_min_max(text: str):
    """
    Parse a simple two-sided numeric interval.

    Supported examples:

        13 - 18
        13.0 - 18.0
        13 to 18

    Returns:

        (13.0, 18.0)

    or:

        None
    """

    if not text:
        return None

    pattern = re.compile(
        r"^\s*"
        r"(-?\d+(?:\.\d+)?)"
        r"\s*(?:-|to)\s*"
        r"(-?\d+(?:\.\d+)?)"
        r"\s*$",
        re.IGNORECASE
    )

    match = pattern.match(
        text.strip()
    )

    if not match:
        return None

    minimum = float(
        match.group(1)
    )

    maximum = float(
        match.group(2)
    )

    if minimum >= maximum:
        return None

    return (
        minimum,
        maximum
    )


# =========================================================
# PATIENT NORMALIZATION
# =========================================================

def normalize_sex(sex):

    if sex is None:
        return None

    value = str(
        sex
    ).strip().lower()

    aliases = {
        "m": "male",
        "male": "male",

        "f": "female",
        "female": "female"
    }

    return aliases.get(
        value
    )


def normalize_age(age):

    if age is None:
        return None

    try:

        age = int(
            age
        )

    except (
        TypeError,
        ValueError
    ):

        return None

    if age <= 0 or age > 120:
        return None

    return age


# =========================================================
# DIRECT RANGE
# =========================================================

def resolve_direct_range(
    reference_text: str,
    patient: dict
):
    """
    Resolve references such as:

        13 - 18
        [13.0-18.0]

    These contain no age/sex distinction.
    """

    parsed = parse_min_max(
        reference_text
    )

    if parsed is None:
        return None

    minimum, maximum = parsed

    return resolved(
        minimum=minimum,
        maximum=maximum,
        matched_by="report_direct",
        age=normalize_age(
            patient.get("age")
        ),
        sex=normalize_sex(
            patient.get("sex")
        )
    )


# =========================================================
# SEX-SPECIFIC RANGE
# =========================================================

def extract_sex_specific_ranges(
    reference_text: str
) -> dict:
    """
    Extract simple sex-specific intervals.

    Examples:

        Male: 13 - 18
        Female: 12 - 16

    Also supports both ranges on one line.
    """

    results = {}

    pattern = re.compile(
        r"\b(male|female)\b"
        r"\s*:?\s*"
        r"(-?\d+(?:\.\d+)?)"
        r"\s*(?:-|to)\s*"
        r"(-?\d+(?:\.\d+)?)",
        re.IGNORECASE
    )

    for match in pattern.finditer(
        reference_text
    ):

        sex = match.group(1).lower()

        minimum = float(
            match.group(2)
        )

        maximum = float(
            match.group(3)
        )

        if minimum >= maximum:
            continue

        results[sex] = {
            "min": minimum,
            "max": maximum
        }

    return results


def resolve_sex_specific_range(
    reference_text: str,
    patient: dict
):
    """
    Resolve a range based on patient sex.
    """

    ranges = extract_sex_specific_ranges(
        reference_text
    )

    if not ranges:
        return None

    sex = normalize_sex(
        patient.get("sex")
    )

    if sex is None:

        return unresolved(
            "The report contains sex-specific reference "
            "intervals, but patient sex is unavailable "
            "or invalid."
        )

    selected = ranges.get(
        sex
    )

    if selected is None:

        return unresolved(
            "The report contains sex-specific reference "
            "intervals, but no interval matched the "
            "patient."
        )

    return resolved(
        minimum=selected["min"],
        maximum=selected["max"],
        matched_by="sex",
        age=normalize_age(
            patient.get("age")
        ),
        sex=sex
    )


# =========================================================
# AGE RANGE MATCHING
# =========================================================

def age_matches(
    age: int,
    minimum_age: float,
    maximum_age: float
) -> bool:

    return (
        age >= minimum_age
        and age <= maximum_age
    )


def extract_age_ranges(
    text: str
) -> list:
    """
    Extract common age-band formats.

    Supported examples:

        18-60 years: 13-17
        18 to 60 years: 13-17
        18-60 yrs: 13-17

    Returns a list of age-range rules.
    """

    rules = []

    pattern = re.compile(
        r"(\d+(?:\.\d+)?)"
        r"\s*(?:-|to)\s*"
        r"(\d+(?:\.\d+)?)"
        r"\s*(?:years?|yrs?)"
        r"\s*:?\s*"
        r"(-?\d+(?:\.\d+)?)"
        r"\s*(?:-|to)\s*"
        r"(-?\d+(?:\.\d+)?)",
        re.IGNORECASE
    )

    for match in pattern.finditer(
        text
    ):

        minimum_age = float(
            match.group(1)
        )

        maximum_age = float(
            match.group(2)
        )

        minimum_value = float(
            match.group(3)
        )

        maximum_value = float(
            match.group(4)
        )

        if minimum_age > maximum_age:
            continue

        if minimum_value >= maximum_value:
            continue

        rules.append({
            "age_min": minimum_age,
            "age_max": maximum_age,
            "min": minimum_value,
            "max": maximum_value
        })

    return rules


# =========================================================
# SEX SECTION EXTRACTION
# =========================================================

def extract_sex_section(
    reference_text: str,
    sex: str
):
    """
    Extract the section belonging to one sex.

    Example:

        Male:
        18-60 years: 13-17
        61-120 years: 12-16

        Female:
        18-60 years: 12-15
        61-120 years: 11-15
    """

    opposite = (
        "female"
        if sex == "male"
        else "male"
    )

    pattern = re.compile(
        rf"\b{sex}\b\s*:?"
        rf"(.*?)"
        rf"(?=\b{opposite}\b\s*:|$)",
        re.IGNORECASE | re.DOTALL
    )

    match = pattern.search(
        reference_text
    )

    if not match:
        return None

    return match.group(1).strip()


# =========================================================
# AGE + SEX
# =========================================================

def resolve_age_and_sex_range(
    reference_text: str,
    patient: dict
):
    """
    Resolve references such as:

        Male:
        18-60 years: 13-17
        61-120 years: 12-16

        Female:
        18-60 years: 12-15
        61-120 years: 11-15
    """

    # Detect whether this looks like an age+sex structure.

    contains_sex = bool(
        re.search(
            r"\b(male|female)\b",
            reference_text,
            re.IGNORECASE
        )
    )

    contains_age_band = bool(
        re.search(
            r"\d+\s*(?:-|to)\s*\d+"
            r"\s*(?:years?|yrs?)",
            reference_text,
            re.IGNORECASE
        )
    )

    if not (
        contains_sex
        and contains_age_band
    ):

        return None

    sex = normalize_sex(
        patient.get("sex")
    )

    age = normalize_age(
        patient.get("age")
    )

    if sex is None:

        return unresolved(
            "The report contains age- and sex-specific "
            "reference intervals, but patient sex is "
            "unavailable or invalid."
        )

    if age is None:

        return unresolved(
            "The report contains age- and sex-specific "
            "reference intervals, but patient age is "
            "unavailable or invalid."
        )

    section = extract_sex_section(
        reference_text,
        sex
    )

    if section is None:

        return unresolved(
            "No reference section matched the "
            "patient's sex."
        )

    age_rules = extract_age_ranges(
        section
    )

    if not age_rules:

        return unresolved(
            "The matching sex section did not contain "
            "a supported age-specific reference interval."
        )

    matches = []

    for rule in age_rules:

        if age_matches(
            age,
            rule["age_min"],
            rule["age_max"]
        ):

            matches.append(
                rule
            )

    # -----------------------------------------------------
    # No matching age band
    # -----------------------------------------------------

    if not matches:

        return unresolved(
            "No age-specific reference interval matched "
            "the patient's age."
        )

    # -----------------------------------------------------
    # Ambiguous overlapping age bands
    # -----------------------------------------------------

    if len(matches) > 1:

        return unresolved(
            "More than one age-specific reference "
            "interval matched the patient. The report "
            "reference is ambiguous."
        )

    selected = matches[0]

    return resolved(
        minimum=selected["min"],
        maximum=selected["max"],
        matched_by="age_and_sex",
        age=age,
        sex=sex
    )


# =========================================================
# AGE-ONLY RANGE
# =========================================================

def resolve_age_specific_range(
    reference_text: str,
    patient: dict
):
    """
    Resolve age-specific ranges that are not separated
    by sex.

    Example:

        1-5 years: 11-14
        6-12 years: 12-15
        13-17 years: 12-16
        18-120 years: 13-17
    """

    # If sex labels exist, this function should not try
    # to interpret the structure.

    if re.search(
        r"\b(male|female)\b",
        reference_text,
        re.IGNORECASE
    ):

        return None

    rules = extract_age_ranges(
        reference_text
    )

    if not rules:
        return None

    age = normalize_age(
        patient.get("age")
    )

    if age is None:

        return unresolved(
            "The report contains age-specific reference "
            "intervals, but patient age is unavailable "
            "or invalid."
        )

    matches = []

    for rule in rules:

        if age_matches(
            age,
            rule["age_min"],
            rule["age_max"]
        ):

            matches.append(
                rule
            )

    if not matches:

        return unresolved(
            "No age-specific reference interval matched "
            "the patient's age."
        )

    if len(matches) > 1:

        return unresolved(
            "More than one age-specific reference "
            "interval matched the patient. The report "
            "reference is ambiguous."
        )

    selected = matches[0]

    return resolved(
        minimum=selected["min"],
        maximum=selected["max"],
        matched_by="age",
        age=age,
        sex=normalize_sex(
            patient.get("sex")
        )
    )


# =========================================================
# MAIN REFERENCE RESOLVER
# =========================================================

def resolve_reference_range(
    reference_raw,
    patient: dict
) -> dict:
    """
    Resolve the laboratory reference interval applicable
    to the current patient.

    Resolution priority:

        1. Age + sex specific
        2. Sex specific
        3. Age specific
        4. Direct simple interval

    IMPORTANT:
    No external medical reference range is used here.

    The only source is the laboratory report.
    """

    reference_text = normalize_reference_text(
        reference_raw
    )

    if not reference_text:

        return unresolved(
            "Reference interval is missing from "
            "the laboratory report."
        )

    # =====================================================
    # 1. AGE + SEX
    # =====================================================

    result = resolve_age_and_sex_range(
        reference_text,
        patient
    )

    if result is not None:
        return result

    # =====================================================
    # 2. SEX
    # =====================================================

    result = resolve_sex_specific_range(
        reference_text,
        patient
    )

    if result is not None:
        return result

    # =====================================================
    # 3. AGE
    # =====================================================

    result = resolve_age_specific_range(
        reference_text,
        patient
    )

    if result is not None:
        return result

    # =====================================================
    # 4. DIRECT
    # =====================================================

    result = resolve_direct_range(
        reference_text,
        patient
    )

    if result is not None:
        return result

    # =====================================================
    # UNSUPPORTED / AMBIGUOUS
    # =====================================================

    return unresolved(
        "The laboratory reference interval could not "
        "be safely resolved for this patient."
    )