"""Debug what each extraction path produces"""
import asyncio
import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from test_real_timetable import make_timetable_image

async def debug():
    # Save image
    img_bytes = make_timetable_image()
    img_path = os.path.join(os.path.dirname(__file__), "test_timetable_grid.png")
    with open(img_path, "wb") as f:
        f.write(img_bytes)

    # 1. Test OCR
    print("=" * 60)
    print("  Step 1: OCR output from RapidOCR")
    print("=" * 60)
    from app.services.ollama_timetable_extractor import OllamaTimetableExtractor
    ext = OllamaTimetableExtractor()
    ocr_text = ext._image_to_text_pil(img_path)
    print(f"OCR text ({len(ocr_text)} chars):")
    print("-" * 40)
    print(ocr_text)
    print("-" * 40)

    # 2. Test regex parser on OCR text
    print("\n" + "=" * 60)
    print("  Step 2: Regex parsers on OCR text")
    print("=" * 60)

    vert_entries = ext._parse_ocr_vertical_lines(ocr_text)
    print(f"Vertical OCR parser found: {len(vert_entries)} entries")
    for e in vert_entries:
        print(f"  {e['day']:12s} {e['start_time']}-{e['end_time']}  {e['subject']}")

    grid_entries = ext._parse_grid_rows(ocr_text)
    print(f"\nGrid parser found: {len(grid_entries)} entries")
    for e in grid_entries:
        print(f"  {e['day']:12s} {e['start_time']}-{e['end_time']}  {e['subject']}")

    day_time_entries = ext._parse_day_time_lines(ocr_text)
    print(f"\nDay-time parser found: {len(day_time_entries)} entries")
    for e in day_time_entries:
        print(f"  {e['day']:12s} {e['start_time']}-{e['end_time']}  {e['subject']}")

    # 3. Test post-processing
    print("\n" + "=" * 60)
    print("  Step 3: Post-processing (best result)")
    print("=" * 60)
    all_entries = vert_entries or grid_entries or day_time_entries
    processed = ext._post_process_entries(all_entries)
    print(f"After post-processing: {len(processed)} entries")
    for e in processed:
        day_names = {0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri"}
        dn = day_names.get(e['day_of_week'], str(e['day_of_week']))
        print(f"  {dn:5s} | {e['start_time']}-{e['end_time']}  {e['subject']}")

    # Cleanup
    os.remove(img_path)

asyncio.run(debug())
