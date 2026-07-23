def validate_tests(tests: list) -> dict:

    issues = []
    valid_tests = []

    if not tests:
        return {
            "status": "UNSAFE_TO_ANALYZE",
            "valid_tests": [],
            "issues": [
                "No supported blood tests were detected."
            ]
        }

    for test in tests:

        test_issues = []

        if not test.get("canonical_name"):
            test_issues.append("missing_test_name")

        if test.get("value") is None:
            test_issues.append("missing_value")

        if not test.get("unit"):
            test_issues.append("missing_unit")

        if not test.get("reference_raw"):
            test_issues.append("missing_reference_range")

        if test_issues:

            issues.append({
                "test": test.get("canonical_name"),
                "issues": test_issues
            })

        else:
            valid_tests.append(test)

    # Determine overall report status

    if len(valid_tests) == 0:
        status = "UNSAFE_TO_ANALYZE"

    elif len(issues) > 0:
        status = "PARTIAL"

    else:
        status = "VALID"

    return {
        "status": status,
        "total_tests": len(tests),
        "valid_test_count": len(valid_tests),
        "valid_tests": valid_tests,
        "issues": issues
    }