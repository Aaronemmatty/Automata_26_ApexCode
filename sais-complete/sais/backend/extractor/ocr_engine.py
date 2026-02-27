from __future__ import annotations

import io

from PIL import Image, ImageOps
import pytesseract


def ocr_image_bytes(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes))
    image = _preprocess(image)
    return pytesseract.image_to_string(image)


def ocr_image_path(file_path: str) -> str:
    image = Image.open(file_path)
    image = _preprocess(image)
    return pytesseract.image_to_string(image)


def _preprocess(image: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(image)
    return ImageOps.autocontrast(gray)
