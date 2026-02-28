"""Direct test of the extractor with logging to see all paths"""
import asyncio
import json
import os
import sys
import logging

sys.path.insert(0, os.path.dirname(__file__))
logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')

from app.services.ollama_timetable_extractor import OllamaTimetableExtractor

async def test():
    img_path = os.path.join(os.path.dirname(__file__), 'test_timetable_grid.png')
    if not os.path.exists(img_path):
        from test_real_timetable import make_timetable_image
        with open(img_path, 'wb') as f:
            f.write(make_timetable_image())

    ext = OllamaTimetableExtractor()
    result = await ext.extract_from_file(img_path)

    status = result.get("status")
    notes = result.get("notes")
    entries = result.get("entries", [])
    print(f"\n{'='*60}")
    print(f"Result status: {status}")
    print(f"Notes: {notes}")
    print(f"Entries: {len(entries)}")
    days = {0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri'}
    for e in entries:
        d = days.get(e.get('day_of_week'), '?')
        print(f"  {d} | {e['start_time']}-{e['end_time']} | {e['subject']}")

asyncio.run(test())
