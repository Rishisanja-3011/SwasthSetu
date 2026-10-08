"""
extraction/pdf_reader.py — Backward-compatibility shim.

The actual implementation has moved to:
    extraction.vaanidoc_pipeline.pdf_reader
"""

from extraction.vaanidoc_pipeline.pdf_reader import *  # noqa: F401, F403
from extraction.vaanidoc_pipeline.pdf_reader import (
    extract_pdf_text,
)