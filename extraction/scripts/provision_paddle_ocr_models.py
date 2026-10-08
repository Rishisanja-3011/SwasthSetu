"""Explicitly download the PaddleOCR models required by this project.

This is a setup command, not part of normal application execution. Run it once
on a machine with internet access, then copy the resulting cache to offline
machines if necessary.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Provision the local PP-OCRv5 English models used by this project."
    )
    parser.add_argument(
        "--cache-root",
        type=Path,
        default=Path.home() / ".paddlex",
        help="PaddleX cache root. Models are stored under official_models/.",
    )
    args = parser.parse_args()

    # PaddleX reads this before PaddleOCR is imported.
    os.environ["PADDLE_PDX_CACHE_HOME"] = str(args.cache_root)

    from vision.ocr_base import OCREngineConfig
    from vision.ocr_paddle import PaddleOCREngine

    config = OCREngineConfig(
        model_cache_dir=args.cache_root / "official_models",
        allow_model_download=True,
    )
    print("Downloading or verifying PaddleOCR models. This may take several minutes...")
    PaddleOCREngine(config).initialize()

    detection, recognition = config.resolved_model_dirs()
    if not config.models_available():
        raise RuntimeError(
            "PaddleOCR completed without creating both expected local model directories. "
            f"Expected: '{detection}' and '{recognition}'."
        )

    print("PaddleOCR models are ready for offline use.")
    print(f"Detection model: {detection}")
    print(f"Recognition model: {recognition}")
    print("Optional environment overrides:")
    print(f"  BLOOD_OCR_DETECTION_MODEL_DIR={detection}")
    print(f"  BLOOD_OCR_RECOGNITION_MODEL_DIR={recognition}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
