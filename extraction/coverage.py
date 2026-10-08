"""
extraction/coverage.py — Backward-compatibility shim.

The actual implementation has moved to:
    extraction.vaanidoc_pipeline.coverage
"""

from extraction.vaanidoc_pipeline.coverage import *  # noqa: F401, F403
from extraction.vaanidoc_pipeline.coverage import (
    check_cbc_coverage,
    SUPPORTED_CBC_MARKERS,
) 