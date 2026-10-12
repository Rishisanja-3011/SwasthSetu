"""JSON bridge used by the canonical Node laboratory workflow.

The lab server stores the original PDF and invokes this bridge with its
absolute path.  Keeping the process boundary here lets the Python extraction
pipeline retain its existing dependencies while the Node API remains the
system of record for reports, observations, review, and publication.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
EXTRACTION_ROOT = REPOSITORY_ROOT / "extraction"
for entry in (REPOSITORY_ROOT, EXTRACTION_ROOT):
    if str(entry) not in sys.path:
        sys.path.insert(0, str(entry))


def _json_safe(value):
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if hasattr(value, "item"):
        return value.item()
    return value


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python extraction/bridge.py <pdf-path>", file=sys.stderr)
        return 2

    from extraction.pipeline import process

    result = process(Path(sys.argv[1]))
    payload = {
        "source": result.source.as_dict(),
        "raw_text": result.raw_text,
        "cleaned_text": result.cleaned_text,
        "patient": result.patient,
        "tests": result.tests,
        "coverage": result.coverage,
        "validation": result.validation,
        "plausibility": result.plausibility,
        "review_required": result.review_required,
        "publish_blocking_reasons": result.publish_blocking_reasons,
        "template_explanation": result.template_explanation,
    }
    print(json.dumps(_json_safe(payload), ensure_ascii=False, allow_nan=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"{type(error).__name__}: {error}", file=sys.stderr)
        raise
