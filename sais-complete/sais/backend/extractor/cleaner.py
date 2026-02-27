from __future__ import annotations

import re
import unicodedata
from collections import Counter


def normalize_text(raw_text: str) -> str:
    text = raw_text or ""
    text = unicodedata.normalize("NFKC", text)

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    lines = _remove_repeated_headers_footers(lines)

    text = "\n".join(lines)
    text = text.replace("\r", "\n")
    text = re.sub(r"[\t ]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def _remove_repeated_headers_footers(lines: list[str]) -> list[str]:
    if len(lines) < 8:
        return lines

    counts = Counter(lines)
    blocked = {line for line, count in counts.items() if count >= 3 and len(line) <= 120}
    return [line for line in lines if line not in blocked]
