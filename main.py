import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from extraction.pdf_reader import extract_pdf_text
from extraction.text_cleaner import clean_pdf_text
from extraction.parser import parse_cbc
from extraction.validator import validate_tests


pdf_path = "samples/reports/sample.pdf"

try:

    raw_text = extract_pdf_text(pdf_path)

    cleaned_text = clean_pdf_text(raw_text)

    tests = parse_cbc(cleaned_text)

    validation = validate_tests(tests)

    print("\n========== VALIDATION ==========\n")

    print("Status:", validation["status"])
    print("Tests detected:", validation["total_tests"])
    print("Valid tests:", validation["valid_test_count"])

    if validation["issues"]:

        print("\nIssues:")

        for issue in validation["issues"]:
            print(
                f"- {issue['test']}: "
                f"{', '.join(issue['issues'])}"
            )

except Exception as error:
    print(f"ERROR: {error}")