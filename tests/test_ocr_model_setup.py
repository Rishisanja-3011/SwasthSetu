"""Offline-safe PaddleOCR model configuration tests."""

from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

from vision.ocr_base import OCREngineConfig
from vision.ocr_paddle import OCRModelUnavailableError, PaddleOCREngine


def _model_directory(path: Path) -> Path:
    path.mkdir(parents=True)
    (path / "model.pdmodel").write_bytes(b"test")
    return path


def test_default_offline_mode_reports_missing_model_paths(tmp_path: Path) -> None:
    config = OCREngineConfig(model_cache_dir=tmp_path)
    engine = PaddleOCREngine(config)

    with pytest.raises(OCRModelUnavailableError, match="provision_paddle_ocr_models"):
        engine.initialize()


def test_local_model_directories_are_passed_to_existing_paddle_api(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    detection = _model_directory(tmp_path / "det")
    recognition = _model_directory(tmp_path / "rec")
    created_with = {}

    class FakePaddleOCR:
        def __init__(self, **kwargs):
            created_with.update(kwargs)

    monkeypatch.setitem(sys.modules, "paddleocr", SimpleNamespace(PaddleOCR=FakePaddleOCR))
    engine = PaddleOCREngine(
        OCREngineConfig(
            detection_model_dir=detection,
            recognition_model_dir=recognition,
        )
    )
    engine.initialize()

    assert created_with["text_detection_model_dir"] == str(detection)
    assert created_with["text_recognition_model_dir"] == str(recognition)
    assert created_with["device"] == "cpu"


def test_model_download_requires_explicit_opt_in(tmp_path: Path) -> None:
    config = OCREngineConfig(model_cache_dir=tmp_path, allow_model_download=True)
    assert config.allow_model_download is True
    assert config.models_available() is False
