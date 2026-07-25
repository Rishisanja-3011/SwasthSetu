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

from extraction.coverage import (
    check_cbc_coverage
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
# DISPLAY CBC COVERAGE
# =========================================================

def display_coverage(
    coverage: dict
):

    print("\n========================================")
    print("          CBC COVERAGE")
    print("========================================")

    print(
        "Status:",
        coverage["status"]
    )

    print(
        "Expected supported markers:",
        coverage["expected_count"]
    )

    print(
        "Detected unique markers:",
        coverage["detected_count"]
    )

    print(
        "Missing markers:",
        coverage["missing_count"]
    )

    print(
        "Coverage:",
        f"{coverage['coverage_percent']}%"
    )

    # -----------------------------------------------------
    # Missing
    # -----------------------------------------------------

    if coverage["missing_markers"]:

        print("\nMissing supported markers:")

        for marker in coverage[
            "missing_markers"
        ]:

            print(
                "-",
                marker
            )

    # -----------------------------------------------------
    # Duplicates
    # -----------------------------------------------------

    if coverage["duplicate_markers"]:

        print("\nDuplicate markers detected:")

        for marker in coverage[
            "duplicate_markers"
        ]:

            print(
                "-",
                marker
            )

    # -----------------------------------------------------
    # Unknown
    # -----------------------------------------------------

    if coverage["unknown_markers"]:

        print("\nUnknown markers:")

        for marker in coverage[
            "unknown_markers"
        ]:

            print(
                "-",
                marker
            )

    # -----------------------------------------------------
    # Complete
    # -----------------------------------------------------

    if (
        coverage["status"] == "COMPLETE"
        and not coverage["duplicate_markers"]
    ):

        print(
            "\n✓ All currently supported CBC "
            "markers were detected."
        )


# =========================================================
# USER CORRECTIONS
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

                    age = int(
                        answer
                    )

                    if 0 < age <= 120:

                        corrections[
                            "age"
                        ] = age

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

                    corrections[
                        "sex"
                    ] = aliases[
                        answer
                    ]

                    break

                print(
                    "Please enter male or female."
                )

    return corrections


# =========================================================
# MAIN PIPELINE
# =========================================================

def main():

    print("\n========================================")
    print("       BLOOD REPORT PROCESSOR")
    print("========================================")

    try:

        # =================================================
        # STEP 1 — READ PDF
        # =================================================

        print(
            "\n[1/8] Reading PDF..."
        )

        raw_text = extract_pdf_text(
            PDF_PATH
        )

        print(
            "✓ PDF text extracted"
        )


        # =================================================
        # STEP 2 — CLEAN
        # =================================================

        print(
            "\n[2/8] Cleaning extracted text..."
        )

        cleaned_text = clean_pdf_text(
            raw_text
        )

        print(
            "✓ Text cleaned"
        )


        # =================================================
        # STEP 3 — PATIENT
        # =================================================

        print(
            "\n[3/8] Extracting patient context..."
        )

        patient = extract_patient_context(
            cleaned_text
        )

        print(
            "✓ Patient extraction completed"
        )


        # =================================================
        # STEP 4 — CBC PARSING
        # =================================================

        print(
            "\n[4/8] Extracting CBC tests..."
        )

        tests = parse_cbc(
            cleaned_text
        )

        print(
            f"✓ {len(tests)} CBC tests detected"
        )


        # =================================================
        # STEP 5 — COVERAGE
        # =================================================

        print(
            "\n[5/8] Checking CBC extraction coverage..."
        )

        coverage = check_cbc_coverage(
            tests
        )

        print(
            "✓ CBC coverage check completed"
        )


        # =================================================
        # STEP 6 — STRUCTURAL VALIDATION
        # =================================================

        print(
            "\n[6/8] Validating report structure..."
        )

        validation = validate_report(
            patient=patient,
            tests=tests
        )

        print(
            "✓ Structural validation completed"
        )


        # =================================================
        # DISPLAY CURRENT EXTRACTION
        # =================================================

        display_patient(
            patient
        )

        display_tests(
            tests
        )

        display_coverage(
            coverage
        )

        display_validation(
            validation
        )


        # =================================================
        # STEP 7 — PATIENT CORRECTIONS
        # =================================================

        print(
            "\n[7/8] Checking whether "
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
        # STEP 8 — PLAUSIBILITY
        # =================================================

        plausibility = None

        if validation["can_analyze"]:

            print(
                "\n[8/8] Running extraction "
                "plausibility checks..."
            )

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
                "\n[8/8] Plausibility check skipped."
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
        # STRUCTURAL FAILURE
        # -------------------------------------------------

        if not validation[
            "can_analyze"
        ]:

            print(
                "✗ Report is not ready for analysis."
            )

            print(
                "Required information must be "
                "resolved first."
            )

            return


        # -------------------------------------------------
        # PLAUSIBILITY FAILURE
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
                "Verify them against the original "
                "report before interpretation."
            )

            return


        # -------------------------------------------------
        # COVERAGE WARNING
        # -------------------------------------------------

        if coverage[
            "status"
        ] != "COMPLETE":

            print(
                "⚠ CBC extraction is incomplete."
            )

            print(
                f"Detected "
                f"{coverage['detected_count']} of "
                f"{coverage['expected_count']} "
                "currently supported markers."
            )

            print(
                "Missing markers should be reviewed "
                "before treating this extraction as "
                "a complete CBC."
            )

            return


        # -------------------------------------------------
        # DUPLICATES
        # -------------------------------------------------

        if coverage[
            "duplicate_markers"
        ]:

            print(
                "⚠ Duplicate CBC markers were detected."
            )

            print(
                "The extraction should be reviewed "
                "before interpretation."
            )

            return


        # -------------------------------------------------
        # PARTIAL STRUCTURAL DATA
        # -------------------------------------------------

        if validation[
            "status"
        ] == "PARTIAL":

            print(
                "⚠ Report contains incomplete "
                "test data."
            )

            print(
                "Incomplete tests will not be used "
                "for interpretation."
            )

            return


        # -------------------------------------------------
        # READY
        # -------------------------------------------------

        print(
            "✓ Report passed structural validation."
        )

        print(
            "✓ CBC extraction coverage is complete "
            "for the current parser profile."
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

        print(
            error
        )


    except ValueError as error:

        print("\n========================================")
        print("              ERROR")
        print("========================================")

        print(
            error
        )


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