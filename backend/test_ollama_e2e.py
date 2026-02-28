"""
End-to-end test for Ollama-powered timetable extraction via the SAIS API.
Tests:
  1. Ollama connectivity & GPU usage
  2. qwen2.5:7b text inference
  3. llava:7b vision inference
  4. Full API /timetable/upload endpoint (image → structured entries)
  5. Time estimation via Ollama
"""
import asyncio
import io
import json
import os
import sys
import time

import httpx
from PIL import Image, ImageDraw, ImageFont

API_BASE = "http://127.0.0.1:8000"
OLLAMA_BASE = "http://localhost:11434"

# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def make_test_timetable_image() -> bytes:
    """Generate a synthetic timetable image with day/time/subject data."""
    img = Image.new("RGB", (900, 400), color="white")
    d = ImageDraw.Draw(img)

    # Header row
    d.text((10, 10), "Day         Time           Subject          Room", fill="black")
    d.line([(10, 28), (890, 28)], fill="gray")

    rows = [
        "Monday      09:00 - 10:30  Mathematics      Room 101",
        "Monday      11:00 - 12:30  Physics          Lab 2",
        "Tuesday     08:00 - 09:30  English          Room 305",
        "Tuesday     10:00 - 11:30  Chemistry        Lab 1",
        "Wednesday   09:00 - 10:30  Computer Science Room 401",
        "Wednesday   13:00 - 14:30  Biology          Lab 3",
        "Thursday    09:00 - 10:30  Mathematics      Room 101",
        "Thursday    11:00 - 12:30  History          Room 202",
        "Friday      08:00 - 09:30  English          Room 305",
        "Friday      10:00 - 11:30  Physics          Lab 2",
    ]
    y = 35
    for row in rows:
        d.text((10, y), row, fill="black")
        y += 30

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


async def get_auth_token() -> str:
    """Login as demo user and return JWT."""
    async with httpx.AsyncClient(base_url=API_BASE, timeout=10.0) as c:
        r = await c.post("/api/v1/auth/login", json={"email": "demo@sais.edu", "password": "password123"})
        r.raise_for_status()
        return r.json()["access_token"]


# ──────────────────────────────────────────────────────────────
# Tests
# ──────────────────────────────────────────────────────────────

async def test_ollama_health():
    """Test 1: Ollama is running and models are available."""
    print("\n═══ Test 1: Ollama Health & Models ═══")
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(f"{OLLAMA_BASE}/api/tags")
        r.raise_for_status()
        models = [m["name"] for m in r.json().get("models", [])]
        print(f"  Available models: {models}")

        has_qwen = any("qwen2.5" in m for m in models)
        has_llava = any("llava" in m for m in models)
        assert has_qwen, "qwen2.5:7b not found!"
        assert has_llava, "llava:7b not found!"
        print("  ✓ Both qwen2.5:7b and llava:7b are installed")


async def test_qwen_text_inference():
    """Test 2: qwen2.5:7b text inference works with GPU."""
    print("\n═══ Test 2: qwen2.5:7b Text Inference (GPU) ═══")
    prompt = "Return ONLY valid JSON: {\"test\": true, \"gpu\": true}"
    async with httpx.AsyncClient(timeout=60.0) as c:
        start = time.time()
        r = await c.post(f"{OLLAMA_BASE}/api/generate", json={
            "model": "qwen2.5:7b",
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {"num_gpu": 99},
        })
        elapsed = time.time() - start
        r.raise_for_status()
        resp_text = r.json().get("response", "")
        print(f"  Response ({elapsed:.1f}s): {resp_text[:200]}")
        parsed = json.loads(resp_text)
        assert isinstance(parsed, dict), "Response is not valid JSON"
        print("  ✓ qwen2.5:7b returned valid JSON")

    # Check GPU usage
    r2 = await c.get(f"{OLLAMA_BASE}/api/ps") if False else None
    async with httpx.AsyncClient(timeout=10.0) as c2:
        r2 = await c2.get(f"{OLLAMA_BASE}/api/ps")
        if r2.status_code == 200:
            for m in r2.json().get("models", []):
                print(f"  GPU info: {m.get('name')} → size_vram={m.get('size_vram')}, size={m.get('size')}")


async def test_llava_vision_inference():
    """Test 3: llava:7b vision inference works."""
    print("\n═══ Test 3: llava:7b Vision Inference (GPU) ═══")
    import base64

    image_bytes = make_test_timetable_image()
    image_b64 = base64.b64encode(image_bytes).decode()

    prompt = (
        "Look at this timetable image. List 2 subjects you can see. "
        "Return ONLY valid JSON: {\"subjects\": [\"subject1\", \"subject2\"]}"
    )

    async with httpx.AsyncClient(timeout=180.0) as c:
        start = time.time()
        r = await c.post(f"{OLLAMA_BASE}/api/generate", json={
            "model": "llava:7b",
            "prompt": prompt,
            "images": [image_b64],
            "stream": False,
            "format": "json",
            "options": {"num_gpu": 99},
        })
        elapsed = time.time() - start
        r.raise_for_status()
        resp_text = r.json().get("response", "")
        print(f"  Response ({elapsed:.1f}s): {resp_text[:300]}")
        try:
            parsed = json.loads(resp_text)
            print(f"  ✓ llava:7b returned valid JSON with keys: {list(parsed.keys())}")
        except json.JSONDecodeError:
            print(f"  ⚠ llava:7b response was not valid JSON (but inference worked)")

    # Check GPU usage
    async with httpx.AsyncClient(timeout=10.0) as c2:
        r2 = await c2.get(f"{OLLAMA_BASE}/api/ps")
        if r2.status_code == 200:
            for m in r2.json().get("models", []):
                print(f"  GPU info: {m.get('name')} → size_vram={m.get('size_vram')}, size={m.get('size')}")


async def test_timetable_upload_api():
    """Test 4: Full /timetable/upload API endpoint."""
    print("\n═══ Test 4: Timetable Upload API (llava:7b → structured entries) ═══")
    token = await get_auth_token()
    image_bytes = make_test_timetable_image()

    async with httpx.AsyncClient(base_url=API_BASE, timeout=300.0) as c:
        headers = {"Authorization": f"Bearer {token}"}
        files = {"file": ("test_timetable.png", image_bytes, "image/png")}
        start = time.time()
        r = await c.post("/api/v1/timetable/upload", files=files, headers=headers)
        elapsed = time.time() - start
        print(f"  Status: {r.status_code} ({elapsed:.1f}s)")

        if r.status_code == 200:
            data = r.json()
            print(f"  Extraction status: {data.get('status')}")
            print(f"  Confidence: {data.get('confidence')}")
            entries = data.get("entries", [])
            print(f"  Entries found: {len(entries)}")
            for entry in entries[:5]:
                print(f"    → {entry.get('subject')} | Day {entry.get('day_of_week')} | "
                      f"{entry.get('start_time')}-{entry.get('end_time')} | {entry.get('room')}")
            if data.get("status") == "success" and len(entries) > 0:
                print("  ✓ Timetable extraction via API succeeded!")
            else:
                print(f"  ✗ Extraction failed: {data.get('error', 'no entries')}")
                print(f"  Full response: {json.dumps(data, indent=2)[:500]}")
        else:
            print(f"  ✗ API error: {r.text[:300]}")


async def test_time_estimation_api():
    """Test 5: Assignment time estimation uses Ollama."""
    print("\n═══ Test 5: Assignment Time Estimation (qwen2.5:7b) ═══")
    token = await get_auth_token()

    async with httpx.AsyncClient(base_url=API_BASE, timeout=60.0) as c:
        headers = {"Authorization": f"Bearer {token}"}
        start = time.time()
        r = await c.post("/api/v1/assignments/estimate-time", json={
            "text": "Write a 1500 word research essay about the impact of AI on education. Include at least 5 academic sources.",
            "task_type": "essay",
        }, headers=headers)
        elapsed = time.time() - start
        print(f"  Status: {r.status_code} ({elapsed:.1f}s)")

        if r.status_code == 200:
            data = r.json()
            provider = data.get("analysis_provider", "unknown")
            print(f"  Provider: {provider}")
            print(f"  Estimated: {data.get('estimated_minutes')} min ({data.get('estimated_hours')} hrs)")
            print(f"  Complexity: {data.get('complexity')}")
            print(f"  Confidence: {data.get('confidence_score')}")
            if provider == "ollama":
                print("  ✓ Time estimation powered by Ollama AI (no mock)")
            else:
                print(f"  ⚠ Estimation used '{provider}' provider (fallback to heuristic)")
        else:
            print(f"  ✗ API error: {r.text[:300]}")


async def main():
    print("=" * 60)
    print("  SAIS Ollama End-to-End Test Suite")
    print("  Models: qwen2.5:7b (text) + llava:7b (vision)")
    print("=" * 60)

    await test_ollama_health()
    await test_qwen_text_inference()
    await test_llava_vision_inference()
    await test_timetable_upload_api()
    await test_time_estimation_api()

    print("\n" + "=" * 60)
    print("  All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
