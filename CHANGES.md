# Changes / Fixes

Date: 2026-02-21

Summary
- Fixed assignment creation issues caused by frontend sending empty strings for optional fields; now empty strings are converted to `null` before sending. See `frontend/src/pages/AssignmentsPage.jsx`.
- Fixed document extraction -> assignment flow: extracted deadline strings are parsed to `date` before creating `Assignment` records and `task_type` is saved into document metadata. See `backend/app/api/documents.py`.
- Fixed Windows test repro that failed to remove the temp upload file by ensuring the file handle is closed. See `backend/test_upload_repro.py`.

Testing / Reproduce
1. Install backend deps and create venv (see `backend/setup_backend.ps1`).
2. Start backend:
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```
3. Start frontend dev server:
```powershell
cd frontend
npm install
npm run dev
```
4. Manual checks performed:
 - Created an assignment via UI; optional fields accepted (empty -> null).
 - Uploaded a small text file via the Upload page; document created with `extraction_status` and the `Save as Assignment` flow produces an `Assignment` record with parsed `deadline` when available.
 - Ran backend tests: `backend/test_upload_repro.py` passes.

Next steps / Recommendations
- If you want full E2E verification, I can run a UI-driven upload + save-as-assignment flow and confirm the assignment appears in the UI.
- Consider adding unit tests for `extract_from_text` and for `activity` conflict checks.
- Commit the changes and create a small release note when you're ready.

Files changed in this work
- `frontend/src/pages/AssignmentsPage.jsx`
- `backend/app/api/documents.py`
- `backend/test_upload_repro.py`
