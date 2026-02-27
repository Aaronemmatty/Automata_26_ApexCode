from __future__ import annotations

from extractor.ocr_engine import ocr_image_path


def extract_image_text(file_path: str) -> dict:
    return {
        "text": ocr_image_path(file_path),
        "used_ocr": True,
        "tables": [],
    }
