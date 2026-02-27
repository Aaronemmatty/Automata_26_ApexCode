from __future__ import annotations

import zipfile

import filetype


def detect_mime_type(file_path: str) -> str:
    with open(file_path, "rb") as f:
        head = f.read(4096)

    kind = filetype.guess(head)
    if kind and kind.mime:
        return kind.mime

    if head.startswith(b"%PDF"):
        return "application/pdf"

    if _is_docx(file_path):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    if _looks_like_text(head):
        return "text/plain"

    return "application/octet-stream"


def classify_document_type(mime: str) -> str:
    if mime == "application/pdf":
        return "pdf"
    if mime in {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    }:
        return "docx"
    if mime.startswith("image/"):
        return "image"
    if mime.startswith("text/"):
        return "txt"
    return "unknown"


def _is_docx(file_path: str) -> bool:
    try:
        with zipfile.ZipFile(file_path, "r") as zf:
            names = set(zf.namelist())
            return "[Content_Types].xml" in names and any(n.startswith("word/") for n in names)
    except Exception:
        return False


def _looks_like_text(blob: bytes) -> bool:
    if not blob:
        return False
    try:
        decoded = blob.decode("utf-8")
    except UnicodeDecodeError:
        try:
            decoded = blob.decode("latin-1")
        except Exception:
            return False

    printable = sum(ch.isprintable() or ch in "\n\r\t" for ch in decoded)
    return printable / max(1, len(decoded)) > 0.9
