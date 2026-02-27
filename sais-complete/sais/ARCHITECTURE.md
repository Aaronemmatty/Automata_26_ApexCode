# Smart Academic Intelligence System (SAIS)
# Architecture Overview

---

## HOW THE LAYERS CONNECT

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  React (Vite) + Tailwind CSS                                │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Auth    │  │ Dashboard  │  │ Upload   │  │ Tracker  │ │
│  │  Pages   │  │  (main)    │  │  Doc     │  │ Pages    │ │
│  └──────────┘  └────────────┘  └──────────┘  └──────────┘ │
│       ↕ axios (JWT in Authorization header)                 │
└─────────────────────────────────────────────────────────────┘
                        ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI BACKEND                           │
│  ┌──────────┐  ┌─────────────┐  ┌──────────┐  ┌─────────┐ │
│  │  /auth   │  │/assignments │  │/documents│  │/alerts  │ │
│  │/attendance│ │ /activities │  │ (upload) │  │         │ │
│  └──────────┘  └─────────────┘  └──────────┘  └─────────┘ │
│       ↕ SQLAlchemy ORM              ↕ AI Services           │
└─────────────────────────────────────────────────────────────┘
        ↕                                    ↕
┌──────────────────┐              ┌────────────────────────┐
│   PostgreSQL     │              │     AI / NLP Layer     │
│                  │              │                        │
│  users           │              │  spaCy  → NER + dates  │
│  assignments     │              │  Tesseract → OCR       │
│  attendance      │              │  Rules  → Predictions  │
│  activities      │              │                        │
│  documents       │              └────────────────────────┘
│  alerts          │
└──────────────────┘
```

---

## LAYER-BY-LAYER EXPLANATION

### 1. FRONTEND (React + Vite + Tailwind)
Renders all UI. After login, stores JWT in localStorage and sends it
in every request header. Pages consume hooks which call the API layer.

Data flow example (upload a doc):
  User selects PDF
  → DocumentUpload component → api/documents.js
  → POST /documents/upload with FormData
  → Backend extracts data with spaCy
  → Returns { subject, deadline, task_type }
  → Frontend shows extracted result card

### 2. BACKEND (FastAPI + Python)
Exposes REST endpoints. Each request goes through:
  Router → Auth middleware → Pydantic validation → Service → DB → Response

- api/      = thin routing layer only
- services/ = all business logic
- models/   = SQLAlchemy table definitions
- schemas/  = Pydantic validation (in + out)
- core/     = JWT utilities, password hashing

### 3. AI LAYER (spaCy + Tesseract + Rules)
Three components:
A. spaCy extractor  → NER for dates, keyword match for task type
B. Tesseract OCR    → image/PDF → raw text → fed into spaCy
C. Rule predictor   → queries DB, applies rules, writes alerts

Rules:
  IF deadlines in next 7 days >= 3 → OVERLOAD ALERT
  IF projected_attendance < 75%    → ATTENDANCE WARNING
  IF activity_date == deadline     → CONFLICT ALERT

### 4. DATABASE (PostgreSQL)
All tables link to users.id. Every service filters by current_user.id
so users only ever see their own data.

---

## FOLDER STRUCTURE

sais/
├── ARCHITECTURE.md
├── docker-compose.yml
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── alembic/
│   └── app/
│       ├── main.py          ← FastAPI app, mounts all routers
│       ├── config.py        ← Env vars, settings
│       ├── database.py      ← SQLAlchemy engine + session
│       ├── models/          ← ORM table definitions
│       ├── schemas/         ← Pydantic in/out models
│       ├── api/             ← Route handlers (thin)
│       ├── services/        ← Business logic
│       ├── core/            ← JWT + password utilities
│       └── ai/              ← spaCy, OCR, predictor
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── api/             ← axios calls per domain
        ├── hooks/           ← custom React hooks
        ├── pages/           ← full page components
        ├── components/      ← reusable UI pieces
        └── utils/           ← helpers, constants
