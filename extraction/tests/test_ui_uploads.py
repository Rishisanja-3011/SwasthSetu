"""Tests for UI upload routing; Vision/OCR is deliberately not duplicated."""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
import pytest

from ui_uploads import UploadValidationError, process_uploaded_file


def _image_bytes(extension: str) -> bytes:
    image = np.full((24, 32, 3), 180, dtype=np.uint8)
    ok, encoded = cv2.imencode(extension, image)
    assert ok
    return encoded.tobytes()


def test_pdf_upload_uses_temporary_pdf_path() -> None:
    received = []

    def fake_pipeline(source):
        received.append(source)
        with open(source, "rb") as handle:
            assert handle.read() == b"%PDF-test"
        return "pdf-result"

    assert process_uploaded_file(b"%PDF-test", "report.pdf", fake_pipeline) == "pdf-result"
    assert len(received) == 1
    assert str(received[0]).endswith(".pdf")
    assert not Path(received[0]).exists()


@pytest.mark.parametrize(
    ("filename", "extension"),
    [("report.jpg", ".jpg"), ("report.jpeg", ".jpeg"), ("report.png", ".png")],
)
def test_image_upload_uses_existing_image_pipeline(filename: str, extension: str) -> None:
    received = []

    def fake_pipeline(source):
        received.append(source)
        return "image-result"

    assert process_uploaded_file(_image_bytes(extension), filename, fake_pipeline) == "image-result"
    assert len(received) == 1
    assert isinstance(received[0], np.ndarray)
    assert received[0].shape == (24, 32, 3)


def test_invalid_file_type_is_rejected() -> None:
    with pytest.raises(UploadValidationError, match="Unsupported file type"):
        process_uploaded_file(b"not a report", "report.txt")


def test_corrupted_image_is_rejected() -> None:
    with pytest.raises(UploadValidationError, match="corrupted"):
        process_uploaded_file(b"not an image", "report.png")


def test_empty_upload_is_rejected() -> None:
    with pytest.raises(UploadValidationError, match="empty"):
        process_uploaded_file(b"", "report.pdf")
