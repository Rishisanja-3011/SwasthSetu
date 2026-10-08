"""Streamlit user interface for the blood-report extraction pipeline.

Run with:
    streamlit run app.py
"""

from __future__ import annotations

import streamlit as st

from extraction.pipeline import PipelineResult
from extraction.plausibility import check_report_plausibility
from extraction.validator import apply_patient_corrections, validate_report
from extraction.ui_uploads import (
    UploadValidationError,
    decode_image_upload,
    is_image_upload,
    process_uploaded_file,
)


st.set_page_config(
    page_title="Blood Report Analyzer",
    page_icon="🩸",
    layout="wide",
)

st.markdown(
    """
    <style>
      .block-container { max-width: 1180px; padding-top: 2.5rem; }
      [data-testid="stMetric"] {
        border: 1px solid #e8e8ee;
        border-radius: 12px;
        padding: 0.8rem;
        background: #ffffff;
      }
    </style>
    """,
    unsafe_allow_html=True,
)


def _run_pipeline(file_bytes: bytes, filename: str) -> PipelineResult:
    """Route an upload through the existing PDF or image pipeline."""
    return process_uploaded_file(file_bytes, filename)


def _status_message(result: PipelineResult) -> tuple[str, str]:
    validation = result.validation
    if not validation.get("can_analyze"):
        return "error", "More information or a clearer report is required before analysis."
    if result.plausibility and result.plausibility.get("requires_verification"):
        return "warning", "Some values need manual verification against the original report."
    if result.coverage.get("status") != "COMPLETE":
        return "warning", "The report was read, but the supported CBC panel is incomplete."
    if result.coverage.get("duplicate_markers"):
        return "warning", "Duplicate markers were detected and should be reviewed."
    return "success", "Extraction checks passed. The report is ready for the next analysis stage."


def _show_results(result: PipelineResult) -> None:
    kind, message = _status_message(result)
    getattr(st, kind)(message)

    source = result.source
    coverage = result.coverage
    metric_columns = st.columns(4)
    metric_columns[0].metric("Tests detected", len(result.tests))
    metric_columns[1].metric("CBC coverage", f"{coverage['coverage_percent']}%")
    metric_columns[2].metric("Pages processed", source.page_count or "—")
    metric_columns[3].metric("OCR pages", source.ocr_pages)

    st.subheader("Patient details")
    patient = result.patient
    patient_columns = st.columns(3)
    age = patient.get("age_value")
    age_unit = patient.get("age_unit") or "years"
    patient_columns[0].write(f"**Age:** {f'{age} {age_unit}' if age is not None else 'Not found'}")
    patient_columns[1].write(f"**Sex:** {(patient.get('sex') or 'Not found').title()}")
    patient_columns[2].write(f"**Source:** {source.input_type.value.replace('_', ' ').title()}")

    if result.validation.get("user_questions"):
        with st.expander("Correct missing patient details", expanded=True):
            with st.form("patient-corrections"):
                entered_age = st.number_input(
                    "Age (years)", min_value=1, max_value=120, value=None, step=1
                )
                entered_sex = st.selectbox("Sex", ("Not provided", "Male", "Female"))
                submitted = st.form_submit_button("Apply corrections")

            if submitted:
                corrections: dict[str, object] = {}
                if entered_age is not None:
                    corrections["age"] = int(entered_age)
                if entered_sex != "Not provided":
                    corrections["sex"] = entered_sex.lower()

                if not corrections:
                    st.info("Enter at least one detail to apply a correction.")
                else:
                    result.patient = apply_patient_corrections(result.patient, corrections)
                    result.validation = validate_report(patient=result.patient, tests=result.tests)
                    valid_tests = result.validation.get("validated_test_data", [])
                    result.plausibility = (
                        check_report_plausibility(valid_tests)
                        if result.validation.get("can_analyze")
                        else None
                    )
                    st.session_state.result = result
                    st.rerun()

    st.subheader("Extracted test results")
    if result.tests:
        flagged = {
            item["test"]
            for item in (result.plausibility or {}).get("verification_required", [])
        }
        rows = []
        for test in result.tests:
            name = test.get("canonical_name", "Unknown")
            rows.append(
                {
                    "Test": name.replace("_", " ").title(),
                    "Result": test.get("value", "—"),
                    "Unit": test.get("unit") or "—",
                    "Reference range": test.get("reference_raw") or "—",
                    "Review": "Required" if name in flagged else "—",
                }
            )
        st.dataframe(rows, use_container_width=True, hide_index=True)
    else:
        st.info("No supported CBC markers were found in this report.")

    warnings = [*source.warnings]
    warnings.extend(
        issue["message"]
        for issue in result.validation.get("issues", [])
        if isinstance(issue, dict) and issue.get("message")
    )
    if warnings:
        with st.expander("Extraction warnings"):
            for warning in dict.fromkeys(warnings):
                st.write(f"- {warning}")

    with st.expander("Technical details"):
        st.json(
            {
                "source": source.as_dict(),
                "coverage": result.coverage,
                "validation": result.validation,
                "plausibility": result.plausibility,
            }
        )


def main() -> None:
    st.title("🩸 Blood Report Analyzer")
    st.caption("Upload a CBC PDF or report image to extract results and check report quality.")

    with st.sidebar:
        st.header("How it works")
        st.write("1. Upload a PDF or image report")
        st.write("2. The system extracts CBC values")
        st.write("3. Review warnings and corrected patient details")
        st.divider()
        st.caption("Supported input: PDF, JPG, JPEG, and PNG reports.")

    uploaded_file = st.file_uploader(
        "Choose a blood-report PDF or image",
        type=["pdf", "jpg", "jpeg", "png"],
    )
    if uploaded_file is not None:
        st.write(f"Selected: **{uploaded_file.name}**")
        file_bytes = uploaded_file.getvalue()
        image_upload = False
        try:
            image_upload = is_image_upload(uploaded_file.name)
            if image_upload:
                preview = decode_image_upload(file_bytes, uploaded_file.name)
                st.image(preview, channels="BGR", caption="Uploaded report image")
                st.caption("Image ready. OCR and extraction begin after Analyze report.")
        except UploadValidationError as error:
            st.error(str(error))

        if st.button("Analyze report", type="primary"):
            try:
                if image_upload:
                    st.info("Running the existing image preprocessing and OCR pipeline…")
                else:
                    st.info("Running the existing PDF extraction pipeline…")
                with st.spinner("Reading and validating the report…"):
                    st.session_state.result = _run_pipeline(
                        file_bytes, uploaded_file.name
                    )
            except UploadValidationError as error:
                st.session_state.pop("result", None)
                st.error(f"Could not process this upload: {error}")
            except Exception as error:
                st.session_state.pop("result", None)
                st.error(f"OCR or extraction failed: {error}")

    if "result" in st.session_state:
        _show_results(st.session_state.result)
    else:
        st.info("Upload a PDF, JPG, JPEG, or PNG file and select **Analyze report** to begin.")

    st.divider()
    st.caption(
        "This tool supports extraction and quality checks only. "
        "It is not a diagnosis and should not replace advice from a qualified clinician."
    )


if __name__ == "__main__":
    main()
