from __future__ import annotations

import argparse
import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

from extractor.cleaner import normalize_text
from extractor.docx_extractor import extract_docx_text
from extractor.file_detector import classify_document_type, detect_mime_type
from extractor.image_extractor import extract_image_text
from extractor.parser import extract_structured_data
from extractor.pdf_extractor import extract_pdf_text


logger = logging.getLogger("extractor")

MAX_FILE_SIZE_MB = 35
EXTRACTION_TIMEOUT_SECONDS = 90


def extract_from_path(file_path: str, original_name: str | None = None) -> dict:
    if not os.path.exists(file_path):
        raise FileNotFoundError("File not found")

    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(f"File too large ({size_mb:.1f}MB). Max {MAX_FILE_SIZE_MB}MB")

    mime = detect_mime_type(file_path)
    doc_type = classify_document_type(mime)
    file_name = original_name or os.path.basename(file_path)

    if doc_type == "unknown":
        raise ValueError(f"Unsupported or unknown file type: {mime}")

    extraction = _run_with_timeout(_extract_text_by_type, file_path, doc_type)
    cleaned = normalize_text(extraction.get("text", ""))

    result = extract_structured_data(
        file_name=file_name,
        detected_type=doc_type,
        cleaned_text=cleaned,
    )
    result["detected_mime"] = mime
    result["used_ocr"] = extraction.get("used_ocr", False)
    if extraction.get("tables"):
        result["tables"] = extraction["tables"]
    return result


def _extract_text_by_type(file_path: str, doc_type: str) -> dict:
    if doc_type == "pdf":
        return extract_pdf_text(file_path)
    if doc_type == "docx":
        return extract_docx_text(file_path)
    if doc_type == "image":
        return extract_image_text(file_path)
    if doc_type == "txt":
        return _extract_text_file(file_path)
    raise ValueError(f"Unsupported document type: {doc_type}")


def _extract_text_file(file_path: str) -> dict:
    for enc in ("utf-8", "latin-1"):
        try:
            with open(file_path, "r", encoding=enc, errors="ignore") as f:
                return {"text": f.read(), "used_ocr": False, "tables": []}
        except Exception:
            continue
    raise ValueError("Unable to decode text file")


def _run_with_timeout(func, *args):
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(func, *args)
        try:
            return future.result(timeout=EXTRACTION_TIMEOUT_SECONDS)
        except FuturesTimeoutError as exc:
            logger.exception("Extraction timed out")
            raise TimeoutError("Extraction timed out") from exc


def _main_cli() -> None:
    parser = argparse.ArgumentParser(description="Extract structured data from a local file")
    parser.add_argument("path", help="Path to input document")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
    output = extract_from_path(args.path)
    print(json.dumps(output, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    _main_cli()
