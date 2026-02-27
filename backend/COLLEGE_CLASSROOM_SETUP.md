# College Events + Google Classroom Setup

## Folder Structure

- app/college_events/
  - college_loader.py
  - sitemap_parser.py
  - url_filter.py
  - content_extractor.py
  - event_parser.py
  - database.py
  - main.py
  - colleges.json
- app/classroom/
  - security.py
  - oauth.py
  - service.py
- app/api/college_events.py
- app/api/classroom.py
- app/models/integrations.py

## Environment Variables

Add in `.env`:

- GOOGLE_CLIENT_ID=
- GOOGLE_CLIENT_SECRET=
- GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/auth/google/callback
- TOKEN_ENCRYPTION_KEY=  # optional Fernet key

## API Examples

- GET `/events?college=FrCRCE`
- GET `/colleges`
- GET `/auth/google/connect`
- GET `/classroom/courses`
- GET `/classroom/events`

## Sample Events Output

```json
[
  {
    "college": "FrCRCE",
    "event_name": "End Semester Examination timetable released",
    "event_type": "Exam",
    "date": "2026-03-15",
    "semester": "Sem 6",
    "department": "Computer",
    "source_url": "https://example.edu/notices/end-sem-exam"
  }
]
```

## Notes

- College list is dynamic via `app/college_events/colleges.json`.
- Google tokens are encrypted before DB storage.
- Classroom endpoints are JWT-protected and user-isolated.
