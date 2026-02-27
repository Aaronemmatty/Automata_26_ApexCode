from __future__ import annotations

import re
from collections import Counter

from dateutil import parser as date_parser

try:
    from langdetect import detect
except Exception:
    detect = None


STOPWORDS = {
    "the", "a", "an", "and", "or", "to", "of", "in", "for", "on", "at", "with", "is", "are",
    "be", "this", "that", "from", "by", "as", "it", "will", "you", "your", "we", "our",
}

EVENT_TYPES = {
    "Exam": ["exam", "midterm", "final test", "test"],
    "Holiday": ["holiday", "vacation", "break", "closed"],
    "Assignment": ["assignment", "submit", "homework", "project"],
    "Lecture": ["lecture", "class", "session", "lesson"],
    "Meeting": ["meeting", "join", "agenda", "minutes"],
    "Deadline": ["deadline", "due", "last date", "before"],
    "Announcement": ["announcement", "notice", "circular", "update"],
}

SUBJECT_PATTERNS = [
    r"\b(mathematics|math|physics|chemistry|biology|history|economics|english|computer science|programming)\b",
    r"\b([A-Z]{2,4}\s?\d{3,4})\b",
]


def extract_structured_data(file_name: str, detected_type: str, cleaned_text: str) -> dict:
    emails = sorted(set(re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", cleaned_text)))
    phones = sorted(set(re.findall(r"(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}", cleaned_text)))
    numeric_values = sorted(set(re.findall(r"\b\d+(?:\.\d+)?\b", cleaned_text)))

    dates = _extract_dates(cleaned_text)
    subjects = _extract_subjects(cleaned_text)
    events = _extract_events(cleaned_text)
    keywords = _extract_keywords(cleaned_text)
    announcements = _extract_announcements(cleaned_text)
    summary = _summarize_text(cleaned_text)
    language = _detect_language(cleaned_text)

    contacts = [{"type": "email", "value": e} for e in emails] + [{"type": "phone", "value": p} for p in phones]

    result = {
        "file_name": file_name,
        "detected_type": detected_type,
        "summary": summary,
        "events": events,
        "dates": dates,
        "contacts": contacts,
        "keywords": keywords,
        "preview": cleaned_text[:600],
        "subjects": subjects,
        "announcements": announcements,
        "numeric_values": numeric_values,
    }
    if language:
        result["language"] = language
    return result


def _extract_dates(text: str) -> list[str]:
    patterns = [
        r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
        r"\b\d{4}-\d{2}-\d{2}\b",
        r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b",
    ]
    found = []
    for pattern in patterns:
        found.extend(re.findall(pattern, text, flags=re.IGNORECASE))

    normalized = []
    for d in sorted(set(found)):
        try:
            normalized.append(date_parser.parse(d, fuzzy=True).date().isoformat())
        except Exception:
            normalized.append(d)
    return normalized


def _extract_subjects(text: str) -> list[str]:
    subjects = []
    for pattern in SUBJECT_PATTERNS:
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        if isinstance(matches, list):
            subjects.extend(m if isinstance(m, str) else m[0] for m in matches)
    return sorted(set(s.strip().title() for s in subjects if s and s.strip()))


def _extract_events(text: str) -> list[dict]:
    sentences = _split_sentences(text)
    events = []
    for sent in sentences:
        event_type = _classify_event(sent)
        if event_type:
            events.append({
                "title": _title_from_sentence(sent),
                "type": event_type,
                "snippet": sent[:240],
            })
    return events[:30]


def _extract_keywords(text: str, limit: int = 20) -> list[str]:
    tokens = re.findall(r"\b[a-zA-Z][a-zA-Z0-9_-]{2,}\b", text.lower())
    filtered = [t for t in tokens if t not in STOPWORDS]
    freq = Counter(filtered)
    return [w for w, _ in freq.most_common(limit)]


def _extract_announcements(text: str) -> list[str]:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    out = []
    for line in lines:
        if any(k in line.lower() for k in ["announcement", "notice", "update", "important"]):
            out.append(line[:240])
    return out[:20]


def _summarize_text(text: str) -> str:
    sentences = _split_sentences(text)
    if not sentences:
        return ""

    freq = Counter(_extract_keywords(text, limit=80))
    scored = []
    for s in sentences:
        words = re.findall(r"\b[a-zA-Z]{3,}\b", s.lower())
        score = sum(freq.get(w, 0) for w in words)
        scored.append((score, s))
    top = [s for _, s in sorted(scored, key=lambda x: x[0], reverse=True)[:3]]
    return " ".join(top)[:500]


def _split_sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 20]


def _classify_event(sentence: str) -> str | None:
    lower = sentence.lower()
    for label, keywords in EVENT_TYPES.items():
        if any(k in lower for k in keywords):
            return label
    return None


def _title_from_sentence(sentence: str) -> str:
    core = sentence.strip().split(":", 1)[0]
    return core[:120]


def _detect_language(text: str) -> str | None:
    if detect is None:
        return None
    sample = text[:2000].strip()
    if not sample:
        return None
    try:
        return detect(sample)
    except Exception:
        return None
