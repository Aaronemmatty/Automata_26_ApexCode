"""
Test with a realistic weekly school timetable image matching the user's format:
  - Days as rows (Monday–Friday)
  - 6 time slots as columns (8:00-9:00 through 1:00-2:00)
  - "Break" column at 11:00-12:00
  - Expected: 25 subject entries (5 days × 5 non-break slots)
"""
import asyncio
import io
import json
import time

import httpx
from PIL import Image, ImageDraw, ImageFont

API_BASE = "http://127.0.0.1:8000"

# ── The exact timetable from the user's image ──
HEADERS = ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-1:00", "1:00-2:00"]
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
GRID = [
    ["Maths",     "Biology",   "Chemistry", "Break", "Physics",  "Maths"],
    ["Biology",   "Chemistry", "English",   "Break", "Social",   "Biology"],
    ["Physics",   "Math",      "Social",    "Break", "English",  "Chemistry"],
    ["Chemistry", "Social",    "Biology",   "Break", "Math",     "Biology"],
    ["English",   "Chemistry", "Maths",     "Break", "Biology",  "Physics"],
]

EXPECTED_ENTRIES = []
for di, day in enumerate(DAYS):
    for ci, subj in enumerate(GRID[di]):
        if subj == "Break":
            continue
        EXPECTED_ENTRIES.append((day, subj, HEADERS[ci]))

print(f"Expected: {len(EXPECTED_ENTRIES)} entries")


def make_timetable_image() -> bytes:
    """Render a timetable image that closely matches the user's screenshot."""
    col_w = 120
    row_h = 35
    label_w = 110
    title_h = 50
    header_h = 30

    cols = len(HEADERS)
    rows = len(DAYS)
    width = label_w + cols * col_w + 20
    height = title_h + header_h + rows * row_h + 20

    img = Image.new("RGB", (width, height), color="#F0F0F0")
    d = ImageDraw.Draw(img)

    # Title
    d.text((width // 2 - 120, 8), "WEEKLY SCHOOL TIMETABLE", fill="black")

    # Header row (time slots)
    y = title_h
    d.rectangle([(label_w, y), (label_w + cols * col_w, y + header_h)], fill="#B0C4DE", outline="black")
    for ci, h in enumerate(HEADERS):
        x = label_w + ci * col_w
        d.rectangle([(x, y), (x + col_w, y + header_h)], outline="black")
        d.text((x + 5, y + 8), h, fill="black")

    # Day rows
    for ri, day in enumerate(DAYS):
        y = title_h + header_h + ri * row_h
        # Day label
        d.rectangle([(0, y), (label_w, y + row_h)], fill="#D0D0D0", outline="black")
        d.text((5, y + 10), day, fill="black")
        # Subject cells
        for ci, subj in enumerate(GRID[ri]):
            x = label_w + ci * col_w
            fill_color = "#E8E8E8" if subj == "Break" else "white"
            d.rectangle([(x, y), (x + col_w, y + row_h)], fill=fill_color, outline="black")
            d.text((x + 5, y + 10), subj, fill="black")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


async def get_auth_token() -> str:
    async with httpx.AsyncClient(base_url=API_BASE, timeout=10.0) as c:
        r = await c.post("/api/v1/auth/login", json={"email": "demo@sais.edu", "password": "password123"})
        r.raise_for_status()
        return r.json()["access_token"]


async def test_extraction():
    print("\n" + "=" * 70)
    print("  Testing extraction of FULL weekly timetable (25 expected entries)")
    print("=" * 70)

    # Save test image to disk for inspection
    image_bytes = make_timetable_image()
    with open("test_timetable_grid.png", "wb") as f:
        f.write(image_bytes)
    print(f"  Saved test image → test_timetable_grid.png ({len(image_bytes)} bytes)")

    token = await get_auth_token()

    async with httpx.AsyncClient(base_url=API_BASE, timeout=600.0) as c:
        headers = {"Authorization": f"Bearer {token}"}
        files = {"file": ("weekly_timetable.png", image_bytes, "image/png")}
        start = time.time()
        r = await c.post("/api/v1/timetable/upload", files=files, headers=headers)
        elapsed = time.time() - start

        print(f"\n  Status: {r.status_code} ({elapsed:.1f}s)")
        if r.status_code != 200:
            print(f"  ERROR: {r.text[:500]}")
            return

        data = r.json()
        entries = data.get("entries", [])
        print(f"  Extraction status: {data.get('status')}")
        print(f"  Confidence: {data.get('confidence')}")
        print(f"  Entries extracted: {len(entries)} / 25 expected")

        # Group by day
        day_names = {0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday"}
        for day_num in range(5):
            day_entries = [e for e in entries if e.get("day_of_week") == day_num]
            day_name = day_names[day_num]
            subjects = [e["subject"] for e in sorted(day_entries, key=lambda x: x.get("start_time", ""))]
            print(f"  {day_name:12s}: {', '.join(subjects) if subjects else '(none)'}")

        # Check coverage
        print(f"\n  {'─' * 50}")
        if len(entries) >= 25:
            print(f"  ✓ PERFECT: All {len(entries)} entries extracted!")
        elif len(entries) >= 20:
            print(f"  ✓ GOOD: {len(entries)}/25 entries (≥80% coverage)")
        elif len(entries) >= 15:
            print(f"  ⚠ PARTIAL: {len(entries)}/25 entries (≥60% coverage)")
        else:
            print(f"  ✗ POOR: Only {len(entries)}/25 entries extracted")

        # Check time conversion (1:00 should become 13:00, 2:00 → 14:00)
        afternoon_slots = [e for e in entries if e.get("start_time", "") >= "12:00"]
        print(f"\n  Afternoon entries (start_time ≥ 12:00): {len(afternoon_slots)}")
        for e in afternoon_slots[:5]:
            print(f"    → {e['subject']} | {e['start_time']}-{e['end_time']}")

        has_13 = any(e.get("start_time") == "13:00" for e in entries)
        has_01 = any(e.get("start_time") == "01:00" for e in entries)
        if has_13:
            print("  ✓ 12h→24h conversion working (1:00 → 13:00)")
        elif has_01:
            print("  ✗ 12h→24h conversion FAILED (still showing 01:00 instead of 13:00)")
        else:
            print("  ? Could not verify 12h→24h conversion")


if __name__ == "__main__":
    asyncio.run(test_extraction())
