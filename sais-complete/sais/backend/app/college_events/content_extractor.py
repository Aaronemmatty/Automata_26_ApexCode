from __future__ import annotations

import io
import logging
import time
import re
from urllib.parse import urljoin

import pdfplumber
import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


def _session() -> requests.Session:
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=0.7, status_forcelist=(429, 500, 502, 503, 504), allowed_methods=("GET",))
    session.mount("http://", HTTPAdapter(max_retries=retry))
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session


def _normalize_lines(text: str) -> str:
    lines = []
    for raw_line in text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        if line:
            lines.append(line)
    return "\n".join(lines)


def _extract_pdf_text(content: bytes) -> str:
    parts = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                parts.append(page_text)
    return _normalize_lines("\n".join(parts))[:50000]


def fetch_main_text(url: str, timeout: int = 20, rate_limit_seconds: float = 0.2) -> str:
    text, _ = fetch_main_text_and_links(url, timeout=timeout, rate_limit_seconds=rate_limit_seconds)
    return text


def fetch_main_text_and_links(url: str, timeout: int = 20, rate_limit_seconds: float = 0.2) -> tuple[str, list[str]]:
    session = _session()
    time.sleep(rate_limit_seconds)
    resp = session.get(url, timeout=timeout)
    resp.raise_for_status()

    content_type = (resp.headers.get("content-type") or "").lower()
    if url.lower().endswith(".pdf") or "application/pdf" in content_type:
        return _extract_pdf_text(resp.content), []

    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()

    main = soup.find("main") or soup.find("article") or soup.body or soup
    text = main.get_text(separator="\n", strip=True)
    links: list[str] = []
    for anchor in main.find_all("a", href=True):
        href = anchor.get("href", "").strip()
        if not href:
            continue
        links.append(urljoin(url, href))

    dedup_links = list(dict.fromkeys(links))
    return _normalize_lines(text)[:30000], dedup_links
