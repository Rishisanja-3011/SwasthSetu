"""
extraction/plausibility.py — Backward-compatibility shim.

The actual implementation has moved to:
    extraction.vaanidoc_pipeline.plausibility
"""

from extraction.vaanidoc_pipeline.plausibility import *  # noqa: F401, F403
from extraction.vaanidoc_pipeline.plausibility import (
    check_test_plausibility,
    check_report_plausibility,
    PLAUSIBILITY_BOUNDS,
)