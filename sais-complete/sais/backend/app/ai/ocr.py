"""
OCR Layer — Phase 2
Converts uploaded images or PDFs to raw text, then feeds into extractor.

Requirements:
  apt-get install tesseract-ocr
  pip install pytesseract Pillow pymupdf
"""
import io
import pytesseract
from PIL import Image
from pathlib import Path


def image_to_text(image_path: str) -> str:
    """
    Run Tesseract OCR on an image file.
    Returns raw extracted text.
    """
    img = Image.open(image_path)
    # Preprocess: convert to grayscale for better OCR accuracy
    img = img.convert("L")
    text = pytesseract.image_to_string(img, lang="eng")
    return text.strip()


def pdf_to_text(pdf_path: str) -> str:
    """
    Extract text from a PDF.
    Strategy:
      1. Try direct text extraction (for digitally created PDFs)
      2. If no text found, render pages as images and OCR them
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise RuntimeError("Install pymupdf: pip install pymupdf")

    doc = fitz.open(pdf_path)
    all_text = []

    for page_num, page in enumerate(doc):
        # Try direct text extraction first
        direct_text = page.get_text("text").strip()

        if len(direct_text) > 50:
            # Good quality digital PDF
            all_text.append(direct_text)
        else:
            # Scanned PDF — render page as image, then OCR
            mat  = fitz.Matrix(2.0, 2.0)     # 2x zoom = higher resolution
            pix  = page.get_pixmap(matrix=mat)
            img  = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img  = img.convert("L")           # grayscale
            text = pytesseract.image_to_string(img, lang="eng")
            all_text.append(text.strip())

    doc.close()
    return "\n\n--- Page Break ---\n\n".join(all_text)


def txt_to_text(txt_path: str) -> str:
    """Read a plain text file."""
    return Path(txt_path).read_text(encoding="utf-8", errors="replace")


def extract_text_from_file(file_path: str, file_type: str) -> str:
    """
    Dispatcher — call the right extractor based on file type.
    file_type: "pdf" | "image" | "txt"
    """
    file_type = file_type.lower().strip()

    if file_type == "pdf":
        return pdf_to_text(file_path)
    elif file_type in ("image", "png", "jpg", "jpeg", "webp", "bmp"):
        return image_to_text(file_path)
    elif file_type in ("txt", "text"):
        return txt_to_text(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def detect_file_type(filename: str) -> str:
    """Infer file type from extension."""
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext == "pdf":
        return "pdf"
    if ext in ("png", "jpg", "jpeg", "webp", "bmp", "tiff"):
        return "image"
    if ext in ("txt", "text", "md"):
        return "txt"
    return "unknown"
