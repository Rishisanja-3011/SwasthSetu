# PaddleOCR local setup

The Vision module uses the existing `PaddleOCREngine` with PaddleOCR 3.x. The
runtime does not download OCR weights by default. This makes normal app runs
predictable and permits offline execution after a one-time provisioning step.

## Pinned runtime

- Python: the active development environment uses Python 3.13.15.
- PaddlePaddle CPU: `3.3.1`
- PaddleOCR: `3.7.0`
- PaddleX: `3.7.2` (also installed transitively by PaddleOCR).
- Model pair: `PP-OCRv5_server_det` and `en_PP-OCRv5_mobile_rec`.

PaddleOCR 3.x requires PaddlePaddle 3.0 or later. This pinned combination was
verified in the active Windows/Python 3.13.15 development environment. Install
the project dependencies first:

```powershell
python -m pip install -r requirements.txt
python -c "import paddle; paddle.utils.run_check()"
```

For a GPU installation, use the PaddlePaddle wheel that matches the target
platform and CUDA runtime, then install the pinned `paddleocr==3.7.0` package.
The application configuration still needs `use_gpu=True` to request a GPU.

## One-time model provisioning

On a connected machine, run:

```powershell
python scripts/provision_paddle_ocr_models.py
```

This is the only project command that opts in to downloading model weights. It
places them under:

```text
%USERPROFILE%\.paddlex\official_models\PP-OCRv5_server_det
%USERPROFILE%\.paddlex\official_models\en_PP-OCRv5_mobile_rec
```

To use another location, run:

```powershell
python scripts/provision_paddle_ocr_models.py --cache-root D:\models\paddlex
```

For an offline machine, copy the complete two model directories to the same
location, or set both of these environment variables before starting Python:

```powershell
$env:BLOOD_OCR_DETECTION_MODEL_DIR = "D:\models\PP-OCRv5_server_det"
$env:BLOOD_OCR_RECOGNITION_MODEL_DIR = "D:\models\en_PP-OCRv5_mobile_rec"
```

`BLOOD_OCR_MODEL_CACHE_DIR` can instead point to the `official_models`
directory containing both model folders.

## Application behavior

`OCREngineConfig(allow_model_download=False)` is the default. When either
model is missing, `PaddleOCREngine` raises `OCRModelUnavailableError` with the
expected paths and provisioning command. It does not contact a model host.

Only an explicit configuration of `allow_model_download=True`, used by the
provisioning script, allows PaddleOCR to fetch missing weights.

## Tests

Normal unit tests use mocked OCR and require neither internet access nor
models. Run the optional real-model smoke test only after provisioning:

```powershell
$env:RUN_PADDLE_OCR_INTEGRATION = "1"
python -X utf8 tests/vision/test_ocr.py
```

Without that flag, the real OCR section is skipped. This prevents ordinary
test runs from downloading weights or depending on local model availability.
