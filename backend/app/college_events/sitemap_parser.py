from __future__ import annotations

import logging
import time
from urllib.parse import urljoin
from xml.etree import ElementTree as ET

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


def _session() -> requests.Session:
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=0.7, status_forcelist=(429, 500, 502, 503, 504), allowed_methods=("GET",))
    session.mount("http://", HTTPAdapter(max_retries=retry))
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session


def detect_sitemap(base_url: str, timeout: int = 20) -> str | None:
    candidates = [
        f"{base_url}/sitemap.xml",
        f"{base_url}/wp-sitemap.xml",
        f"{base_url}/sitemap_index.xml",
    ]
    session = _session()
    for candidate in candidates:
        try:
            resp = session.get(candidate, timeout=timeout)
            if resp.status_code == 200 and "xml" in resp.headers.get("content-type", ""):
                return candidate
        except Exception:
            continue
    return None


def _parse_xml_urls(xml_text: str) -> list[str]:
    root = ET.fromstring(xml_text.encode("utf-8", errors="ignore"))
    urls = []
    for element in root.iter():
        if element.tag.endswith("loc") and element.text:
            urls.append(element.text.strip())
    return urls


def collect_relevant_urls(base_url: str, sitemap_url: str, keywords: list[str], timeout: int = 20, rate_limit_seconds: float = 0.25) -> list[str]:
    session = _session()

    index_resp = session.get(sitemap_url, timeout=timeout)
    index_resp.raise_for_status()
    index_locs = _parse_xml_urls(index_resp.text)

    sitemap_files = [u for u in index_locs if u.endswith(".xml")]
    if not sitemap_files:
        sitemap_files = [sitemap_url]

    target_urls: list[str] = []
    seen = set()

    for sitemap_file in sitemap_files:
        time.sleep(rate_limit_seconds)
        try:
            resp = session.get(sitemap_file, timeout=timeout)
            resp.raise_for_status()
            urls = _parse_xml_urls(resp.text)
        except Exception as exc:
            logger.warning("Failed sitemap %s: %s", sitemap_file, exc)
            continue

        for url in urls:
            absolute = url if url.startswith("http") else urljoin(base_url + "/", url)
            lowered = absolute.lower()
            if any(k in lowered for k in keywords):
                if absolute not in seen:
                    seen.add(absolute)
                    target_urls.append(absolute)

    return target_urls
