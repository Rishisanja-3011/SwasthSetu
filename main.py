from extraction.pdf_reader import extract_pdf_text
from extraction.text_cleaner import clean_pdf_text
from extraction.parser import parse_cbc
from extraction.patient_parser import extract_patient_context

from extraction.validator import (
    validate_report,
    apply_patient_corrections
)

from extraction.plausibility import (
    check_report_plausibility
)


# =========================================================
# CONFIGURATION
# =========================================================

PDF_PATH = "samples/reports/sample.pdf"


# =========================================================
# DISPLAY PATIENT
# =========================================================

def display_patient(patient: dict):

    print("\n========================================")
    print("              PATIENT")
    print("========================================")

    age = patient.get("age")
    sex = patient.get("sex")

    print(
        "Age:",
        age if age is not None else "NOT FOUND"
    )

    print(
        "Sex:",
        sex if sex else "NOT FOUND"
    )


# =========================================================
# DISPLAY TESTS
# =========================================================

def display_tests(tests: list):

    print("\n========================================")
    print("         EXTRACTED CBC TESTS")
    print("========================================")

    if not tests:

        print("No supported CBC tests detected.")
        return

    for number, test in enumerate(
        tests,
        start=1
    ):

        print(f"\nTest #{number}")

        print(
            "Name:",
            test.get("raw_name")
        )

        print(
            "Canonical:",
            test.get("canonical_name")
        )

        print(
            "Value:",
            test.get("value")
        )

        print(
            "Unit:",
            test.get("unit")
        )

        print(
            "Reference:",
            test.get("reference_raw")
        )


# =========================================================
# DISPLAY VALIDATION
# =========================================================

def display_validation(validation: dict):

    print("\n========================================")
    print("         REPORT VALIDATION")
    print("========================================")

    print(
        "Status:",
        validation["status"]
    )

    print(
        "Can analyze:",
        validation["can_analyze"]
    )

    print(
        "Tests detected:",
        validation["tests_detected"]
    )

    print(
        "Valid tests:",
        validation["valid_tests"]
    )

    if validation["issues"]:

        print("\nIssues:")

        for issue in validation["issues"]:

            print(
                "-",
                issue["message"]
            )


# =========================================================
# DISPLAY PLAUSIBILITY
# =========================================================

def display_plausibility(
    plausibility: dict
):

    print("\n========================================")
    print("       PLAUSIBILITY CHECK")
    print("========================================")

    print(
        "Tests checked:",
        plausibility["checked_tests"]
    )

    print(
        "Require verification:",
        plausibility[
            "verification_required_count"
        ]
    )

    if not plausibility[
        "requires_verification"
    ]:

        print(
            "✓ No suspicious extraction values detected."
        )

        return

    print("\nValues requiring verification:")

    for item in plausibility[
        "verification_required"
    ]:

        print(
            f"- {item['test']}: "
            f"{item['value']}"
        )

        print(
            f"  Reason: {item['reason']}"
        )


# =========================================================
# USER CORRECTION
# =========================================================

def request_patient_corrections(
    validation: dict
) -> dict:

    corrections = {}

    questions = validation.get(
        "user_questions",
        []
    )

    if not questions:
        return corrections

    print("\n========================================")
    print("       INFORMATION REQUIRED")
    print("========================================")

    for item in questions:

        field = item["field"]
        question = item["question"]

        # -------------------------------------------------
        # AGE
        # -------------------------------------------------

        if field == "age":

            while True:

                answer = input(
                    f"\n{question} "
                ).strip()

                try:

                    age = int(answer)

                    if 0 < age <= 120:

                        corrections["age"] = age
                        break

                    print(
                        "Please enter an age "
                        "between 1 and 120."
                    )

                except ValueError:

                    print(
                        "Please enter age as a number."
                    )

        # -------------------------------------------------
        # SEX
        # -------------------------------------------------

        elif field == "sex":

            while True:

                answer = input(
                    f"\n{question} "
                ).strip().lower()

                aliases = {
                    "m": "male",
                    "male": "male",
                    "f": "female",
                    "female": "female"
                }

                if answer in aliases:

                    corrections["sex"] = (
                        aliases[answer]
                    )

                    break

                print(
                    "Please enter male or female."
                )

    return corrections


# =========================================================
# MAIN
# =========================================================

def main():

    print("\n========================================")
    print("       BLOOD REPORT PROCESSOR")
    print("========================================")

    try:

        # =================================================
        # STEP 1 — PDF
        # =================================================

        print("\n[1/7] Reading PDF...")

        raw_text = extract_pdf_text(
            PDF_PATH
        )

        print("✓ PDF text extracted")


        # =================================================
        # STEP 2 — CLEAN
        # =================================================

        print("\n[2/7] Cleaning extracted text...")

        cleaned_text = clean_pdf_text(
            raw_text
        )

        print("✓ Text cleaned")


        # =================================================
        # STEP 3 — PATIENT
        # =================================================

        print(
            "\n[3/7] Extracting patient context..."
        )

        patient = extract_patient_context(
            cleaned_text
        )

        print(
            "✓ Patient extraction completed"
        )


        # =================================================
        # STEP 4 — CBC
        # =================================================

        print(
            "\n[4/7] Extracting CBC tests..."
        )

        tests = parse_cbc(
            cleaned_text
        )

        print(
            f"✓ {len(tests)} CBC tests detected"
        )


        # =================================================
        # STEP 5 — STRUCTURAL VALIDATION
        # =================================================

        print(
            "\n[5/7] Validating report structure..."
        )

        validation = validate_report(
            patient=patient,
            tests=tests
        )

        print(
            "✓ Structural validation completed"
        )

        display_patient(
            patient
        )

        display_tests(
            tests
        )

        display_validation(
            validation
        )


        # =================================================
        # STEP 6 — PATIENT CORRECTION LOOP
        # =================================================

        print(
            "\n[6/7] Checking whether "
            "patient corrections are required..."
        )

        correction_attempts = 0
        max_correction_attempts = 3

        while (
            validation["status"]
            == "NEEDS_USER_INPUT"
            and correction_attempts
            < max_correction_attempts
        ):

            correction_attempts += 1

            corrections = (
                request_patient_corrections(
                    validation
                )
            )

            if not corrections:

                print(
                    "\nNo corrections were provided."
                )

                break

            patient = apply_patient_corrections(
                patient,
                corrections
            )

            print(
                "\nApplying corrections..."
            )

            validation = validate_report(
                patient=patient,
                tests=tests
            )

            print(
                "✓ Report revalidated"
            )

            display_patient(
                patient
            )

            display_validation(
                validation
            )


        # =================================================
        # STEP 7 — PLAUSIBILITY
        # =================================================

        plausibility = None

        if validation["can_analyze"]:

            print(
                "\n[7/7] Running extraction "
                "plausibility checks..."
            )

            # IMPORTANT:
            #
            # Run plausibility only against tests that
            # already passed structural validation.

            structurally_valid_tests = (
                validation.get(
                    "validated_test_data",
                    []
                )
            )

            plausibility = (
                check_report_plausibility(
                    structurally_valid_tests
                )
            )

            print(
                "✓ Plausibility check completed"
            )

            display_plausibility(
                plausibility
            )

        else:

            print(
                "\n[7/7] Plausibility check skipped."
            )

            print(
                "Report has not passed required "
                "structural validation."
            )


        # =================================================
        # FINAL DECISION
        # =================================================

        print("\n========================================")
        print("          SYSTEM DECISION")
        print("========================================")

        # -------------------------------------------------
        # Cannot structurally analyze
        # -------------------------------------------------

        if not validation["can_analyze"]:

            print(
                "✗ Report is not ready for analysis."
            )

            print(
                "Required information must be "
                "resolved first."
            )

            return


        # -------------------------------------------------
        # Suspicious extraction
        # -------------------------------------------------

        if (
            plausibility
            and plausibility[
                "requires_verification"
            ]
        ):

            print(
                "⚠ Report requires verification."
            )

            print(
                "One or more extracted values appear "
                "unusually extreme."
            )

            print(
                "These values must be checked against "
                "the original report before they are "
                "used for medical interpretation."
            )

            return


        # -------------------------------------------------
        # Partial
        # -------------------------------------------------

        if validation["status"] == "PARTIAL":

            print(
                "⚠ Report is partially usable."
            )

            print(
                f"✓ {validation['valid_tests']} "
                "structurally valid tests are available."
            )

            print(
                "⚠ Incomplete tests will not be used."
            )

            return


        # -------------------------------------------------
        # Ready
        # -------------------------------------------------

        print(
            "✓ Report passed structural validation."
        )

        print(
            "✓ No suspicious extraction values detected."
        )

        print(
            "✓ Report is ready for the next stage."
        )


    # =====================================================
    # ERRORS
    # =====================================================

    except FileNotFoundError as error:

        print("\n========================================")
        print("              ERROR")
        print("========================================")

        print(error)


    except ValueError as error:

        print("\n========================================")
        print("              ERROR")
        print("========================================")

        print(error)


    except Exception as error:

        print("\n========================================")
        print("         UNEXPECTED ERROR")
        print("========================================")

        print(
            f"{type(error).__name__}: {error}"
        )


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":
    main()