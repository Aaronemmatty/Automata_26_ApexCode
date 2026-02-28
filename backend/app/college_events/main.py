from __future__ import annotations

import asyncio
import logging
import time
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from .college_loader import CollegeLoader
from .content_extractor import fetch_main_text, fetch_main_text_and_links
from .database import save_events_with_fallback
from .event_parser import parse_events_from_page
from .sitemap_parser import collect_relevant_urls, detect_sitemap
from .url_filter import filter_urls

logger = logging.getLogger(__name__)

# ─── In-memory cache (college_name -> (timestamp, events)) ────────────
_events_cache: dict[str, tuple[float, list[dict]]] = {}
_CACHE_TTL_SECONDS = 600  # 10 minutes


def _scrape_events_sync(college) -> list[dict]:
    """All synchronous web scraping happens here — runs in a thread."""
    sitemap_url = college.sitemap_url or detect_sitemap(college.base_url)
    if not sitemap_url:
        raise ValueError(f"No sitemap found for {college.name}")

    urls = collect_relevant_urls(college.base_url, sitemap_url, college.keywords)
    urls = filter_urls(urls, college.keywords)
    urls = list(dict.fromkeys([*college.seed_urls, *urls]))

    all_events: list[dict] = []
    seen_sources: set[str] = set()
    for url in urls[:80]:
        if url in seen_sources:
            continue
        seen_sources.add(url)
        try:
            text, discovered_links = fetch_main_text_and_links(url)
            page_events = parse_events_from_page(text, source_url=url, college_name=college.name)
            all_events.extend(page_events)

            for link in discovered_links:
                lowered = link.lower()
                if link in seen_sources:
                    continue
                if not lowered.endswith('.pdf'):
                    continue
                if not any(k in lowered for k in college.keywords):
                    continue
                seen_sources.add(link)

                try:
                    pdf_text = fetch_main_text(link)
                    pdf_events = parse_events_from_page(pdf_text, source_url=link, college_name=college.name)
                    all_events.extend(pdf_events)
                except Exception as exc:
                    logger.warning("Skipping linked PDF %s: %s", link, exc)
        except Exception as exc:
            logger.warning("Skipping %s: %s", url, exc)

    return all_events


async def fetch_events_for_college(college_name: str, db: AsyncSession) -> list[dict]:
    # Check cache first
    cached = _events_cache.get(college_name)
    if cached:
        cached_time, cached_events = cached
        if time.time() - cached_time < _CACHE_TTL_SECONDS:
            logger.info("Returning %d cached events for %s", len(cached_events), college_name)
            return cached_events

    loader = CollegeLoader()
    college = loader.get_by_name(college_name)
    if college is None:
        raise ValueError(f"College '{college_name}' not found in config")

    # Run blocking scraping in a thread so we don't block the event loop
    all_events = await asyncio.to_thread(_scrape_events_sync, college)

    fallback_file = Path("./uploads/college_events_fallback.json")
    saved = await save_events_with_fallback(db, all_events, fallback_file)

    # Cache the results
    _events_cache[college_name] = (time.time(), saved)
    return saved
