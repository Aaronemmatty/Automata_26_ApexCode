# SAIS — Smart Academic Intelligence System

AI-powered academic management platform for students. Automates assignment tracking, attendance monitoring, timetable management, college event scraping, and Google Classroom integration.

---

## Features

- **📚 Assignment Management** — Create, track, and update assignments with AI-powered deadline extraction
- **✅ Attendance Tracking** — Monitor attendance with 75% threshold warnings and recovery planning
- **🎯 Activities & Conflicts** — Track extracurricular activities with automatic conflict detection
- **📅 Smart Timetable** — Upload and extract timetables using Gemini AI vision
- **🏫 College Events** — Scrape and display academic events from college websites (FrCRCE integrated)
- **📖 Google Classroom** — OAuth integration to sync courses, assignments, and announcements
- **📄 Document Upload** — AI extraction from PDFs, images, and text files using OCR + Gemini
- **🔔 AI Alerts** — Proactive notifications for overdue assignments, low attendance, and scheduling conflicts

---

## Tech Stack

**Backend:**
- FastAPI (Python 3.11+)
- SQLAlchemy (async) with SQLite
- Google Gemini AI for smart extraction
- Tesseract OCR for image processing
- BeautifulSoup4 for web scraping
- Google APIs for Classroom integration

**Frontend:**
- React 18 + Vite
- TailwindCSS for styling
- React Router for navigation
- Axios for API calls
- Recharts for data visualization

---

## Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Tesseract OCR**
  - Windows: [Download installer](https://github.com/UB-Mannheim/tesseract/wiki)
  - Ubuntu: `sudo apt install tesseract-ocr`
  - macOS: `brew install tesseract`
- **Optional:**
  - Google Gemini API key (free from [Google AI Studio](https://aistudio.google.com/))
  - Google Cloud Console OAuth credentials for Classroom integration

---

### 1. Backend Setup

```bash
cd sais/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set:
#   - TESSERACT_CMD (path to tesseract executable)
#   - SECRET_KEY (generate: python -c "import secrets; print(secrets.token_urlsafe(32))")
#   - GEMINI_API_KEY (optional, for AI features)
#   - GOOGLE_CLIENT_ID/SECRET (optional, for Classroom integration)

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Server starts at http://localhost:8000
# API docs at http://localhost:8000/docs
```

**Demo account auto-created:** `demo@sais.edu` / `password123`

---

### 2. Frontend Setup

```bash
cd sais/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Opens at http://localhost:5173
```

---

## Google Classroom Integration

### Setup OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Classroom API**
4. Create OAuth 2.0 credentials:
   - **Authorized redirect URIs:**
     - `http://127.0.0.1:8000/auth/google/callback`
     - `http://localhost:8000/auth/google/callback`
5. Add OAuth scopes:
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
   - `https://www.googleapis.com/auth/classroom.coursework.me.readonly`
   - `https://www.googleapis.com/auth/classroom.announcements.readonly`
6. Add test users (while in "Testing" mode):
   - Go to **OAuth consent screen** → **Test users** → Add your Gmail address
7. Copy **Client ID** and **Client Secret** to `.env` file

---

## API Reference

### Authentication
- `POST /api/v1/auth/register` — Create user account
- `POST /api/v1/auth/login` — Login and get JWT token
- `GET /api/v1/auth/me` — Get current user info

### Assignments
- `GET /api/v1/assignments/` — List assignments (filterable by status/subject)
- `POST /api/v1/assignments/` — Create assignment
- `PATCH /api/v1/assignments/{id}` — Update assignment
- `DELETE /api/v1/assignments/{id}` — Delete assignment
- `POST /api/v1/assignments/estimate-time` — AI-powered time estimation

### Attendance
- `GET /api/v1/attendance/subjects` — List tracked subjects
- `POST /api/v1/attendance/subjects` — Add subject
- `POST /api/v1/attendance/mark` — Mark attendance
- `GET /api/v1/attendance/summary` — Get attendance percentages
- `GET /api/v1/attendance/alerts` — Get low attendance warnings

### Activities
- `GET /api/v1/activities/` — List activities
- `POST /api/v1/activities/` — Create activity
- `DELETE /api/v1/activities/{id}` — Delete activity
- `POST /api/v1/activities/refresh-conflicts` — Check for conflicts

### Timetable
- `POST /api/v1/timetable/upload` — Upload timetable image (Gemini extraction)
- `GET /api/v1/timetable/entries` — Get timetable entries
- `POST /api/v1/timetable/entries/bulk` — Bulk save entries

### College Events
- `GET /colleges` — Get configured colleges
- `GET /events?college=FrCRCE` — Fetch scraped events

### Google Classroom
- `GET /auth/google/connect?token={jwt}` — Initiate OAuth flow
- `GET /auth/google/callback` — OAuth callback (auto-handled)
- `GET /classroom/courses` — List enrolled courses
- `GET /classroom/events` — Get assignments and announcements

### Documents
- `POST /api/v1/documents/upload` — Upload PDF/image/text file
- `GET /api/v1/documents` — List uploaded documents
- `POST /api/v1/documents/{id}/save-as-assignment` — Convert to assignment

---

## Project Structure

```
sais/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + startup
│   │   ├── config.py            # Settings from .env
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models/              # ORM models (User, Assignment, etc.)
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── api/                 # Route handlers
│   │   ├── core/                # Auth, dependencies, security
│   │   ├── services/            # Business logic
│   │   ├── ai/                  # Gemini integration
│   │   ├── classroom/           # Google Classroom OAuth + API
│   │   └── college_events/      # Web scraping
│   ├── extractor/               # Document extraction (OCR + parsing)
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
│
└── frontend/
    ├── src/
    │   ├── main.jsx             # App entry point
    │   ├── App.jsx              # Routes + auth provider
    │   ├── api/                 # API client functions
    │   ├── hooks/               # Custom hooks (useAuth, etc.)
    │   ├── pages/               # Page components
    │   ├── components/          # Reusable UI components
    │   └── lib/                 # Utilities
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── .gitignore
```

---

## Environment Variables

Required in `backend/.env`:

```env
# Database
DATABASE_URL=sqlite+aiosqlite:///./sais.db
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe  # Update path

# Security
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# App Config
APP_NAME=SAIS
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Optional: Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3-flash-preview

# Optional: Google Classroom
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/auth/google/callback

# File Uploads
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=10
```

---

## Features in Detail

### AI Document Extraction
Upload assignment PDFs, screenshots, or text files. The system uses:
1. **Tesseract OCR** for image-based documents
2. **Gemini AI** for intelligent parsing of subjects, deadlines, task types
3. Automatic assignment creation with extracted metadata

### College Event Scraping
- Automatically scrapes college websites for academic calendars
- Parses PDF notices and event listings
- Pre-configured for **Fr. Conceição Rodrigues College of Engineering (FrCRCE)**
- Extracts exam dates, holidays, and important notices

### Attendance Intelligence
- Track attendance per subject
- 75% threshold warnings (common university requirement)
- "Classes needed to recover" calculation
- Visual attendance percentages
- Historical attendance logs

### Conflict Detection
- Compares assignments, activities, and events
- Flags scheduling conflicts
- Helps prioritize overlapping commitments

---

## Development

### Backend
```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black app/
isort app/
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Contributing

This is a hackathon project built for demonstration purposes. The codebase prioritizes rapid development and feature completeness over production-grade scalability.

---

## License

MIT License - feel free to use this for your own projects!

---

## Acknowledgments

- **Gemini AI** for intelligent document parsing
- **Google Classroom API** for seamless LMS integration
- **Tesseract OCR** for image text extraction
- **FastAPI** for the amazing async framework
- **React** + **Vite** for blazing-fast frontend development
- **TailwindCSS** for beautiful, responsive UI
