# Universal Document Extractor

## File structure

```
extractor/
  file_detector.py
  pdf_extractor.py
  docx_extractor.py
  image_extractor.py
  ocr_engine.py
  parser.py
  cleaner.py
  main.py
```

## Run (API)

`POST /extract`

Form field: `file`

### Example (curl)

```bash
curl -X POST http://127.0.0.1:8000/extract \
  -F "file=@sample.pdf"
```

## Run (local file input)

```bash
python -m extractor.main "C:/path/to/document.pdf"
```

## Output JSON

```json
{
  "file_name": "sample.pdf",
  "detected_type": "pdf",
  "summary": "...",
  "events": [],
  "dates": [],
  "contacts": [],
  "keywords": [],
  "preview": "..."
}
```

## Notes

- MIME/type detection is based on file bytes, not filename.
- PDF extraction uses `pdfplumber` with OCR fallback for scanned/mixed files.
- OCR uses `pytesseract`.
- Parsing combines regex + rule-based classification.
- Endpoint includes timeout and error handling for invalid/corrupt files.
