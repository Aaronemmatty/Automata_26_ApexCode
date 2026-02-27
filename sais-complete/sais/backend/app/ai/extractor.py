"""
AI Text Extractor — Phase 2
Uses spaCy NER + keyword matching to pull structured data from raw text.

Install: pip install spacy
         python -m spacy download en_core_web_sm
"""
import re
from datetime import datetime, date
from dateutil import parser as dateutil_parser
from app.schemas.schemas import ExtractionResult

try:
    import spacy
except Exception:
    spacy = None

# Load once at import time (expensive operation)
if spacy is not None:
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        nlp = None
else:
    nlp = None


# ─── Keyword banks ────────────────────────────────────────────

TASK_KEYWORDS = {
    "assignment": ["assignment", "homework", "hw", "submit", "submission", "due"],
    "exam":       ["exam", "examination", "final", "midterm", "test", "paper"],
    "quiz":       ["quiz", "quizzes", "mcq", "short test"],
    "project":    ["project", "report", "presentation", "capstone"],
    "announcement": ["announcement", "notice", "update", "reminder", "inform"],
}

SUBJECT_PATTERNS = [
    r"\b(mathematics|math|maths)\b",
    r"\b(physics|phy)\b",
    r"\b(chemistry|chem)\b",
    r"\b(computer science|cs|programming|data structures|algorithms|dbms|os)\b",
    r"\b(english|literature|writing)\b",
    r"\b(economics|econ)\b",
    r"\b(history)\b",
    r"\b(biology|bio)\b",
    r"\b(machine learning|ml|artificial intelligence|ai|deep learning)\b",
    # Course code format: CS301, PHY102, etc.
    r"\b([A-Z]{2,4}\s?\d{3,4})\b",
]

DEADLINE_TRIGGERS = [
    r"due\s+(?:on|by|date)?[:\s]+(.+)",
    r"deadline[:\s]+(.+)",
    r"submit\s+(?:by|before|on)[:\s]+(.+)",
    r"last\s+date[:\s]+(.+)",
    r"submission\s+date[:\s]+(.+)",
]


# ─── Main extractor ───────────────────────────────────────────

def extract_from_text(raw_text: str) -> ExtractionResult:
    """
    Given raw text (from OCR or file read), extract:
    - subject
    - task_type
    - title (first meaningful line)
    - deadline (date string)
    - confidence (0-1 rough score)
    """
    if not raw_text or not raw_text.strip():
        return ExtractionResult(confidence=0.0)

    text_lower = raw_text.lower()

    task_type  = _detect_task_type(text_lower)
    subject    = _detect_subject(text_lower)
    deadline   = _detect_deadline(raw_text)
    title      = _extract_title(raw_text)
    confidence = _score_confidence(task_type, subject, deadline)

    return ExtractionResult(
        subject=subject,
        task_type=task_type,
        title=title,
        deadline=deadline,
        confidence=confidence,
    )


# ─── Sub-extractors ───────────────────────────────────────────

def _detect_task_type(text_lower: str) -> str:
    """
    Return the task type with the most keyword hits.
    Defaults to 'other'.
    """
    scores = {t: 0 for t in TASK_KEYWORDS}
    for task_type, keywords in TASK_KEYWORDS.items():
        for kw in keywords:
            if re.search(r"\b" + re.escape(kw) + r"\b", text_lower):
                scores[task_type] += 1

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "other"


def _detect_subject(text_lower: str) -> str | None:
    """Match known subject patterns and course codes."""
    for pattern in SUBJECT_PATTERNS:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            return match.group(0).strip().title()
    return None


def _detect_deadline(raw_text: str) -> str | None:
    """
    1. Try regex patterns for explicit deadline phrases
    2. Try explicit DD/MM/YYYY or D/M/YYYY bare date patterns (dayfirst)
    3. Fall back to spaCy DATE entities
    """
    # Step 1: Pattern matching on explicit lead-in phrases
    for pattern in DEADLINE_TRIGGERS:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            parsed = _try_parse_date(candidate)
            if parsed:
                return parsed

    # Step 2: Bare DD/MM/YYYY or DD/MM/YY or D/M/YYYY patterns (common in screenshots)
    bare_date_pattern = r"\b(\d{1,2}[/\-.](\d{1,2})[/\-.](\d{2,4}))\b"
    for m in re.finditer(bare_date_pattern, raw_text):
        candidate = m.group(0)
        # Try dayfirst=True (DD/MM/YYYY) first, then default
        parsed = _try_parse_date(candidate, dayfirst=True) or _try_parse_date(candidate)
        if parsed:
            return parsed

    # Step 3: spaCy NER — find DATE entities (if spaCy model is available)
    if nlp is not None:
        doc = nlp(raw_text[:2000])  # limit to first 2000 chars for speed
        for ent in doc.ents:
            if ent.label_ == "DATE":
                parsed = _try_parse_date(ent.text)
                if parsed:
                    return parsed

    return None


def _try_parse_date(text: str, dayfirst: bool = False) -> str | None:
    """Try to parse a date string to ISO format (YYYY-MM-DD)."""
    try:
        dt = dateutil_parser.parse(text, fuzzy=True, dayfirst=dayfirst)
        # Sanity check: accept dates up to 2 years in the future or 1 year in the past
        today = datetime.utcnow().date()
        delta = (dt.date() - today).days
        if -365 < delta < 730:
            return dt.strftime("%Y-%m-%d")
    except (ValueError, OverflowError):
        pass
    return None


def _extract_title(raw_text: str) -> str | None:
    """Use the first non-empty, non-header line as a candidate title."""
    skip_words = {"dear", "hi", "hello", "to", "from", "date", "subject:", "re:"}
    for line in raw_text.split("\n"):
        line = line.strip()
        if len(line) > 10 and line.lower().split()[0] not in skip_words:
            return line[:200]  # cap at 200 chars
    return None


def _score_confidence(task_type: str, subject: str | None, deadline: str | None) -> float:
    """Rough confidence score based on what was found."""
    score = 0.0
    if task_type and task_type != "other":
        score += 0.4
    if subject:
        score += 0.3
    if deadline:
        score += 0.3
    return round(score, 2)
