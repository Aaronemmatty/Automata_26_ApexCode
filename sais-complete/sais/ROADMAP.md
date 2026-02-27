# SAIS Development Roadmap & API Reference

---

## QUICK START (Local Dev)

### Option A: Docker (recommended)
```bash
git clone <repo>
docker-compose up --build
# Backend: http://localhost:8000
# Docs:    http://localhost:8000/docs
```

### Option B: Manual setup
```bash
# 1. Start PostgreSQL
createdb sais_db
psql sais_db < backend/schema.sql

# 2. Backend
cd backend
cp .env.example .env          # fill in DATABASE_URL and SECRET_KEY
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload  # runs on :8000

# 3. Frontend
cd frontend
npm install
npm run dev                    # runs on :5173
```

---

## PHASE IMPLEMENTATION GUIDE

### PHASE 1 — Auth + Assignment CRUD  ✓
Files to build:
  - backend/app/core/security.py        (JWT + bcrypt)
  - backend/app/core/dependencies.py    (get_current_user dep)
  - backend/app/models/user.py          (User ORM model)
  - backend/app/models/assignment.py    (Assignment ORM model)
  - backend/app/schemas/schemas.py      (Pydantic schemas)
  - backend/app/services/auth_service.py
  - backend/app/services/assignment_service.py
  - backend/app/api/auth.py
  - backend/app/api/assignments.py
  - backend/app/main.py

Test with curl:
  curl -X POST http://localhost:8000/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","username":"test","password":"test1234"}'

  curl -X POST http://localhost:8000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test1234"}'
  # → { "access_token": "eyJ...", "token_type": "bearer" }

---

### PHASE 2 — Document Upload + AI Extraction  ✓
Files to build:
  - backend/app/ai/extractor.py         (spaCy extraction)
  - backend/app/ai/ocr.py               (Tesseract OCR)
  - backend/app/models/document_alert.py (Document ORM)
  - backend/app/api/documents.py

Install system dep for Tesseract:
  Ubuntu: sudo apt-get install tesseract-ocr
  macOS:  brew install tesseract

Test:
  curl -X POST http://localhost:8000/documents/upload \
    -H "Authorization: Bearer <token>" \
    -F "file=@assignment.pdf"

---

### PHASE 3 — Attendance Tracking  ✓
Files to build:
  - backend/app/models/attendance.py    (Subject + AttendanceRecord)
  - backend/app/services/attendance_service.py
  - backend/app/api/attendance.py

Key logic:
  - attendance_percentage = (present + late) / total * 100
  - below_threshold = percentage < 75%
  - projection formula: (present + x) / (total + x) >= 0.75

---

### PHASE 4 — Activities + AI Predictions  ✓
Files to build:
  - backend/app/models/activity.py
  - backend/app/models/document_alert.py (Alert ORM)
  - backend/app/services/activity_service.py
  - backend/app/services/alert_service.py
  - backend/app/api/activities.py
  - backend/app/api/alerts.py
  - backend/app/scheduler.py

AI Rules:
  1. OVERLOAD:   IF deadlines in 7 days >= 3 → critical alert
  2. LOW ATTEND: IF any subject < 75% → critical alert per subject
  3. DEADLINE:   IF assignment due tomorrow → warning alert
  4. CONFLICT:   Detected at activity creation time (immediate)

---

## COMPLETE API REFERENCE

### Auth
| Method | Path             | Auth | Description              |
|--------|-----------------|------|--------------------------|
| POST   | /auth/register  | ✗    | Register new user        |
| POST   | /auth/login     | ✗    | Login → JWT token        |
| GET    | /auth/me        | ✓    | Get current user profile |

### Assignments
| Method | Path                        | Description                    |
|--------|----------------------------|--------------------------------|
| GET    | /assignments                | List (filter: status, subject) |
| POST   | /assignments                | Create manually                |
| GET    | /assignments/upcoming       | Due in next N days (default 7) |
| GET    | /assignments/{id}           | Get one                        |
| PATCH  | /assignments/{id}           | Update (status, deadline, etc) |
| DELETE | /assignments/{id}           | Delete                         |

### Attendance
| Method | Path                              | Description                     |
|--------|------------------------------------|-------------------------------- |
| GET    | /attendance/subjects               | List subjects                   |
| POST   | /attendance/subjects               | Add subject                     |
| POST   | /attendance/mark                   | Mark present/absent/late        |
| GET    | /attendance/summary                | Get % per subject                |
| GET    | /attendance/project/{subject_id}   | Project future attendance       |

### Activities
| Method | Path                          | Description                  |
|--------|-------------------------------|------------------------------|
| GET    | /activities                   | List all                     |
| POST   | /activities                   | Add (auto conflict-check)    |
| DELETE | /activities/{id}              | Delete                       |
| POST   | /activities/refresh-conflicts | Re-run conflict detection    |

### Documents
| Method | Path                                 | Description               |
|--------|--------------------------------------|---------------------------|
| POST   | /documents/upload                    | Upload + extract          |
| GET    | /documents                           | List uploads              |
| POST   | /documents/{id}/save-as-assignment   | Convert extracted → task  |

### Alerts
| Method | Path                  | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | /alerts               | List (filter: unread_only)     |
| POST   | /alerts/refresh       | Run AI prediction engine now   |
| PATCH  | /alerts/{id}/read     | Mark alert as read             |

---

## FRONTEND PAGES

| Route         | Component        | Key Features                             |
|---------------|-----------------|------------------------------------------|
| /login        | LoginPage        | JWT login form                           |
| /register     | RegisterPage     | Registration form                        |
| /             | DashboardPage    | Stats cards, upcoming, alerts, attendance bars |
| /assignments  | AssignmentsPage  | Full CRUD table with inline status change |
| /attendance   | AttendancePage   | Per-subject cards with 4-button marking  |
| /activities   | ActivitiesPage   | Grid cards with conflict badges          |
| /upload       | UploadPage       | Drag-drop upload with extraction preview |

---

## ENVIRONMENT VARIABLES

| Variable                      | Example                            | Required |
|------------------------------|-------------------------------------|----------|
| DATABASE_URL                 | postgresql+asyncpg://...            | ✓        |
| SECRET_KEY                   | (32+ char random string)            | ✓        |
| ALGORITHM                    | HS256                               | ✗        |
| ACCESS_TOKEN_EXPIRE_MINUTES  | 1440                                | ✗        |
| UPLOAD_DIR                   | ./uploads                           | ✗        |
| DEBUG                        | True                                | ✗        |
| ALLOWED_ORIGINS              | http://localhost:5173               | ✗        |

---

## HACKATHON DEMO CHECKLIST

- [ ] Register a new user
- [ ] Login, verify JWT works
- [ ] Add 3 assignments with deadlines within 7 days
- [ ] Hit POST /alerts/refresh → verify OVERLOAD alert appears
- [ ] Add a subject, mark attendance < 75% → verify attendance warning
- [ ] Add activity on same date as assignment → verify CONFLICT badge
- [ ] Upload a PDF with a deadline → verify extraction results
- [ ] Dashboard shows all 4 stat cards populated

---

## EXTENDING THE PROJECT (Post-Hackathon)

1. Email notifications (FastAPI-Mail) on alert generation
2. Calendar view with recharts or react-big-calendar
3. Transformers (HuggingFace) for smarter text extraction
4. Website monitoring cron — scrape university portals for announcements
5. Mobile PWA support
6. Export to PDF report (assignments + attendance summary)
