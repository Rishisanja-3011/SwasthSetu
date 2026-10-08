"""
extraction/parser.py — Backward-compatibility shim.

The actual implementation has moved to:
    extraction.vaanidoc_pipeline.parser
"""

from extraction.vaanidoc_pipeline.parser import *  # noqa: F401, F403
from extraction.vaanidoc_pipeline.parser import (
    TEST_ALIASES,
    parse_cbc,
)
