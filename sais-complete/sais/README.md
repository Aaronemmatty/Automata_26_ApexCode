# SAIS — Smart Academic Intelligence System
### Hackathon-Ready Full Stack AI Project

---

## Architecture at a Glance

```
Browser (React + Vite)
    │  REST/JSON
FastAPI (Python)
    ├── Gemini AI     ← Smart analysis & extraction
    ├── Tesseract     ← OCR for images
    ├── BeautifulSoup ← College website scraping
    ├── Google APIs   ← Classroom integration
    └── SQLAlchemy    ← SQLite ORM (async)
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node 18+
- Tesseract OCR installed on system:
  - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
  - Ubuntu: `sudo apt install tesseract-ocr`
  - Mac: `brew install tesseract`
- (Optional) Google Cloud Console account for Classroom integration
- (Optional) Gemini API key for AI features

---

### 1. Backend Setup

### 1. Backend Setup

```bash
cd sais/backend

# Create virtual env
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your:
#   - TESSERACT_CMD path
#   - SECRET_KEY (generate a secure random string)
#   - GEMINI_API_KEY (optional, from Google AI Studio)
#   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (optional, from Google Cloud Console)

# Run the server
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs   (Swagger UI)

# Demo account auto-created: demo@sais.edu / password123
```

---

### 2. Frontend Setup

```bash
cd sais/frontend

npm install
npm run dev
# → http://localhost:5173
```

---

## API Endpoint Reference

| Method | Endpoint                    | Description                        |
|--------|-----------------------------|------------------------------------|
| POST   | /api/v1/auth/register       | Create account                     |
| POST   | /api/v1/auth/login          | Get JWT token                      |
| GET    | /api/v1/auth/me             | Current user                       |
| GET    | /api/v1/assignments         | List (filterable)                  |
| POST   | /api/v1/assignments         | Create manually                    |
| PUT    | /api/v1/assignments/:id     | Update (status, deadline, etc.)    |
| DELETE | /api/v1/assignments/:id     | Delete                             |
| GET    | /api/v1/assignments/subjects| List subjects                      |
| POST   | /api/v1/assignments/subjects| Create subject                     |
| POST   | /api/v1/attendance/mark     | Mark present/absent/late           |
| GET    | /api/v1/attendance/summary  | % per subject + warnings           |
| GET    | /api/v1/attendance/:id      | Records for one subject            |
| POST   | /api/v1/documents/upload    | Upload PDF/image/txt               |
| GET    | /api/v1/documents           | List uploads                       |
| GET    | /api/v1/activities          | List activities                    |
| POST   | /api/v1/activities          | Add activity (auto-detects conflict)|
| DELETE | /api/v1/activities/:id      | Remove                             |
| GET    | /api/v1/alerts              | Get active alerts (refreshed)      |
| POST   | /api/v1/alerts/refresh      | Force AI re-run                    |
| GET    | /api/v1/dashboard           | All dashboard data in one call     |

---

## Phase Delivery Roadmap

### ✅ Phase 1 — Foundation (Day 1)
- [x] PostgreSQL schema with all tables
- [x] FastAPI app with CORS + JWT middleware
- [x] Auth endpoints (register/login/me)
- [x] Assignment CRUD with subject linking
- [x] Pydantic schemas for all models
- [x] React auth (Login/Register pages)

### ✅ Phase 2 — AI Ingestion (Day 2 morning)
- [x] spaCy pipeline: subject + task type + deadline extraction
- [x] Tesseract OCR for image inputs
- [x] PyPDF2 for PDF text extraction
- [x] Background document processing (FastAPI BackgroundTasks)
- [x] Document upload endpoint → auto-create assignments
- [x] React Documents page with polling for status

### ✅ Phase 3 — Attendance (Day 2 afternoon)
- [x] Mark attendance (upsert per subject/date)
- [x] Auto-calculate attendance % per subject
- [x] 75% threshold warning
- [x] "Classes needed to recover" calculation
- [x] React Attendance page with ring charts

### ✅ Phase 4 — Activities + AI Alerts (Day 3)
- [x] Activity CRUD
- [x] Conflict detection (±1 day around deadlines)
- [x] Alert engine: overload / attendance_low / deadline_tomorrow / conflict
- [x] APScheduler cron: hourly alerts, daily overdue marking
- [x] React Dashboard with stat cards, alert list, attendance chart
- [x] React Activities page with conflict banners

---

## Project Folder Structure

```
sais/
├── ARCHITECTURE.md              ← System diagram + data flow
├── README.md                    ← This file
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── schema.sql               ← Raw SQL schema
│   └── app/
│       ├── main.py              ← App factory + startup
│       ├── config.py            ← Settings from .env
│       ├── core/
│       │   ├── database.py      ← SQLAlchemy engine + get_db
│       │   ├── security.py      ← JWT + password hashing
│       │   └── deps.py          ← get_current_user dependency
│       ├── models/
│       │   ├── user.py          ← User ORM
│       │   └── academic.py      ← Subject/Assignment/Attendance/Activity/Document/Alert
│       ├── schemas/
│       │   └── schemas.py       ← All Pydantic request/response models
│       ├── api/
│       │   ├── auth.py          ← /auth routes
│       │   ├── assignments.py   ← /assignments routes
│       │   ├── attendance.py    ← /attendance routes
│       │   ├── activities.py    ← /activities routes
│       │   ├── documents.py     ← /documents upload route
│       │   └── alerts.py        ← /alerts + /dashboard routes
│       └── services/
│           ├── extractor.py     ← spaCy + OCR + PDF extraction
│           ├── alert_engine.py  ← AI prediction logic
│           └── scheduler.py     ← APScheduler cron jobs
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx              ← Router + QueryClient
        ├── index.css            ← Tailwind + fonts
        ├── lib/
        │   └── api.js           ← Axios instance + all API calls
        ├── store/
        │   └── authStore.js     ← Zustand auth state
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── AssignmentsPage.jsx
        │   ├── AttendancePage.jsx
        │   ├── ActivitiesPage.jsx
        │   └── DocumentsPage.jsx
        └── components/
            └── ui/
                ├── Layout.jsx       ← Sidebar + shell
                └── components.jsx   ← Card/Badge/Button/Input/Modal/etc.
```

---

## Key Design Decisions

**Why async SQLAlchemy?**
FastAPI is async-native. Using `asyncpg` + async sessions means DB queries never block the event loop, allowing concurrent request handling.

**Why BackgroundTasks for OCR?**
OCR and NLP can take 2-5 seconds. Returning 202 Accepted immediately + polling the document status gives a much better UX than blocking the HTTP response.

**Why refresh alerts on every GET /alerts?**
For a hackathon demo, freshness matters more than performance. In production, you'd cache alerts in Redis and only refresh on schedule or on data mutation.

**Why Zustand instead of Redux?**
Zustand is ~1KB, has no boilerplate, and is perfectly suited for a single-user auth store. Redux adds overhead without benefit here.

---

## Demo Credentials (for testing)

After running the backend, register via:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","full_name":"Demo Student","password":"demo1234"}'
```
