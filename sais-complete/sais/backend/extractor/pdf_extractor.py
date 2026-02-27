from __future__ import annotations

import fitz
import pdfplumber

from extractor.ocr_engine import ocr_image_bytes


def extract_pdf_text(file_path: str) -> dict:
    page_texts: list[str] = []
    tables: list[list[list[str | None]]] = []

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = (page.extract_text() or "").strip()
            page_texts.append(text)

            try:
                page_tables = page.extract_tables() or []
                tables.extend(page_tables)
            except Exception:
                pass

    combined = "\n\n".join(t for t in page_texts if t).strip()
    low_text_density = _is_low_text_density(page_texts)

    if not combined or low_text_density:
        ocr_text = _ocr_pdf_pages(file_path)
        merged = "\n\n".join([combined, ocr_text]).strip() if combined else ocr_text
        return {
            "text": merged,
            "used_ocr": True,
            "tables": tables,
        }

    return {
        "text": combined,
        "used_ocr": False,
        "tables": tables,
    }


def _ocr_pdf_pages(file_path: str) -> str:
    text_parts: list[str] = []
    pdf = fitz.open(file_path)
    try:
        for page in pdf:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            text_parts.append(ocr_image_bytes(pix.tobytes("png")))
    finally:
        pdf.close()

    return "\n\n".join(p for p in text_parts if p.strip())


def _is_low_text_density(page_texts: list[str]) -> bool:
    if not page_texts:
        return True
    non_empty = [p for p in page_texts if p.strip()]
    if not non_empty:
        return True
    avg_len = sum(len(p) for p in non_empty) / len(non_empty)
    return avg_len < 80
