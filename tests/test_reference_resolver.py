from interpretation.reference_resolver import (
    resolve_reference_range
)


def show_result(name, result):

    print("\n========================================")
    print(name)
    print("========================================")

    print(
        "Resolved:",
        result["resolved"]
    )

    print(
        "Min:",
        result["min"]
    )

    print(
        "Max:",
        result["max"]
    )

    print(
        "Matched by:",
        result["matched_by"]
    )

    print(
        "Matched age:",
        result["matched_age"]
    )

    print(
        "Matched sex:",
        result["matched_sex"]
    )

    if result["reason"]:

        print(
            "Reason:",
            result["reason"]
        )


# =========================================================
# TEST 1 — CURRENT REPORT FORMAT
# =========================================================

result = resolve_reference_range(
    "[13.0-18.0]",
    {
        "age": 34,
        "sex": "male"
    }
)

show_result(
    "TEST 1 — DIRECT RANGE",
    result
)

assert result["resolved"] is True
assert result["min"] == 13.0
assert result["max"] == 18.0
assert result["matched_by"] == "report_direct"

print("✓ PASSED")


# =========================================================
# TEST 2 — SEX SPECIFIC / MALE
# =========================================================

reference = """
Male: 13.0 - 17.0
Female: 12.0 - 15.0
"""

result = resolve_reference_range(
    reference,
    {
        "age": 34,
        "sex": "male"
    }
)

show_result(
    "TEST 2 — SEX SPECIFIC MALE",
    result
)

assert result["resolved"] is True
assert result["min"] == 13.0
assert result["max"] == 17.0
assert result["matched_by"] == "sex"
assert result["matched_sex"] == "male"

print("✓ PASSED")


# =========================================================
# TEST 3 — SEX SPECIFIC / FEMALE
# =========================================================

result = resolve_reference_range(
    reference,
    {
        "age": 34,
        "sex": "female"
    }
)

show_result(
    "TEST 3 — SEX SPECIFIC FEMALE",
    result
)

assert result["resolved"] is True
assert result["min"] == 12.0
assert result["max"] == 15.0
assert result["matched_by"] == "sex"
assert result["matched_sex"] == "female"

print("✓ PASSED")


# =========================================================
# TEST 4 — AGE + SEX / MALE
# =========================================================

reference = """
Male:
18-60 years: 13.0-17.0
61-120 years: 12.0-16.0

Female:
18-60 years: 12.0-15.0
61-120 years: 11.0-15.0
"""

result = resolve_reference_range(
    reference,
    {
        "age": 34,
        "sex": "male"
    }
)

show_result(
    "TEST 4 — AGE + SEX MALE",
    result
)

assert result["resolved"] is True
assert result["min"] == 13.0
assert result["max"] == 17.0
assert result["matched_by"] == "age_and_sex"

print("✓ PASSED")


# =========================================================
# TEST 5 — AGE + SEX / OLDER FEMALE
# =========================================================

result = resolve_reference_range(
    reference,
    {
        "age": 72,
        "sex": "female"
    }
)

show_result(
    "TEST 5 — AGE + SEX FEMALE",
    result
)

assert result["resolved"] is True
assert result["min"] == 11.0
assert result["max"] == 15.0
assert result["matched_by"] == "age_and_sex"

print("✓ PASSED")


# =========================================================
# TEST 6 — AGE ONLY
# =========================================================

reference = """
1-5 years: 11.0-14.0
6-12 years: 12.0-15.0
13-17 years: 12.0-16.0
18-120 years: 13.0-17.0
"""

result = resolve_reference_range(
    reference,
    {
        "age": 10,
        "sex": "male"
    }
)

show_result(
    "TEST 6 — AGE ONLY",
    result
)

assert result["resolved"] is True
assert result["min"] == 12.0
assert result["max"] == 15.0
assert result["matched_by"] == "age"

print("✓ PASSED")


# =========================================================
# TEST 7 — SEX REQUIRED BUT MISSING
# =========================================================

reference = """
Male: 13.0-17.0
Female: 12.0-15.0
"""

result = resolve_reference_range(
    reference,
    {
        "age": 34,
        "sex": None
    }
)

show_result(
    "TEST 7 — MISSING SEX",
    result
)

assert result["resolved"] is False

print("✓ PASSED")


# =========================================================
# TEST 8 — AGE REQUIRED BUT MISSING
# =========================================================

reference = """
1-5 years: 11.0-14.0
6-12 years: 12.0-15.0
18-120 years: 13.0-17.0
"""

result = resolve_reference_range(
    reference,
    {
        "age": None,
        "sex": "male"
    }
)

show_result(
    "TEST 8 — MISSING AGE",
    result
)

assert result["resolved"] is False

print("✓ PASSED")


# =========================================================
# TEST 9 — AGE DOES NOT MATCH
# =========================================================

reference = """
1-5 years: 11.0-14.0
6-12 years: 12.0-15.0
"""

result = resolve_reference_range(
    reference,
    {
        "age": 34,
        "sex": "male"
    }
)

show_result(
    "TEST 9 — AGE NOT COVERED",
    result
)

assert result["resolved"] is False

print("✓ PASSED")


# =========================================================
# TEST 10 — AMBIGUOUS AGE BANDS
# =========================================================

reference = """
10-20 years: 11.0-14.0
15-25 years: 12.0-15.0
"""

result = resolve_reference_range(
    reference,
    {
        "age": 18,
        "sex": "male"
    }
)

show_result(
    "TEST 10 — AMBIGUOUS AGE",
    result
)

assert result["resolved"] is False

print("✓ PASSED")


# =========================================================
# TEST 11 — MISSING REFERENCE
# =========================================================

result = resolve_reference_range(
    None,
    {
        "age": 34,
        "sex": "male"
    }
)

show_result(
    "TEST 11 — MISSING REFERENCE",
    result
)

assert result["resolved"] is False

print("✓ PASSED")


# =========================================================
# FINAL
# =========================================================

print("\n========================================")
print("   ALL REFERENCE RESOLVER TESTS PASSED")
print("========================================")