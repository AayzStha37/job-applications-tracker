# Job Applications Tracker

A local-only, single-user job application tracker. Three pieces:

- **`backend/`** — Spring Boot REST API with SQLite storage
- **`frontend/`** — React Kanban board (Vite + dnd-kit + react-query)
- **`extension/`** — Chromium MV3 browser extension with a **Track** button that
  extracts job details from the current page and posts them to the backend

Everything runs on `127.0.0.1`. No auth, no cloud.

---

## Prerequisites

- Docker + Docker Compose (recommended), **or** Java 21 + Node.js 20+ for a bare-metal run
- Chrome, Edge, or Brave (for the extension)

---

## Run it with Docker (recommended)

From the repo root:

```bash
docker compose up --build
```

This starts:

- **backend** on `http://127.0.0.1:8080` — SQLite data persists in the named volume `jobtracker-data` (`/data/jobs.db` inside the container)
- **frontend** on `http://127.0.0.1:5173` — nginx serving the built Vite bundle

Stop with `Ctrl+C`; remove the data volume with `docker compose down -v`.

The browser extension is **not** containerized — extensions live in the browser.
See [Extension](#3-extension) below.

---

## Run it bare-metal

### 1. Backend (`:8080`)

```bash
cd backend
./gradlew bootRun
```

SQLite file lands at `backend/data/jobs.db` (created on first run). Flyway
applies migrations from `backend/src/main/resources/db/migration/`.

Smoke test:

```bash
curl -X POST 127.0.0.1:8080/applications \
  -H 'Content-Type: application/json' \
  -d '{"company":"Acme","position":"SWE","location":"NYC","url":"https://x.com/j/1","source":"manual","externalJobId":"1"}'

curl 127.0.0.1:8080/applications

curl -X PATCH 127.0.0.1:8080/applications/1 \
  -H 'Content-Type: application/json' \
  -d '{"status":"INTERVIEW"}'
```

Re-POSTing the same `(source, externalJobId)` returns `200` with the existing
row (dedup), not a duplicate.

### 2. Frontend (`:5173`)

```bash
cd frontend
npm install
npm run dev
```

Open <http://127.0.0.1:5173>. Drag cards across columns to update status.
Double-click a card to open the detail drawer for notes or deletion.

### 3. Extension

```bash
cd extension
npm install
npm run build
```

Load unpacked in the browser:

1. Go to `chrome://extensions` (or `edge://extensions`, `brave://extensions`)
2. Enable **Developer mode**
3. Click **Load unpacked** and select `extension/dist`

Open any job posting (LinkedIn, Workday, Indeed, Glassdoor, company page),
click the extension icon, review/edit the extracted fields, click **Save**.

---

## API

| Method | Path                     | Body                                                            | Notes |
|--------|--------------------------|-----------------------------------------------------------------|-------|
| POST   | `/applications`          | `{company, position, location?, url, source, externalJobId?, notes?}` | `201` on create, `200` on dedup hit |
| GET    | `/applications`          | —                                                               | Sorted by `updated_at DESC` |
| PATCH  | `/applications/{id}`     | `{status?, notes?}`                                             | |
| DELETE | `/applications/{id}`     | —                                                               | |

**Statuses:** `APPLIED` · `SCREEN` · `INTERVIEW` · `OFFER` · `REJECTED` · `WITHDRAWN`

---

## How the extension extracts data

Each field is resolved by an ordered pipeline — first non-empty value wins:

1. **JSON-LD `JobPosting` schema** — covers Greenhouse, Lever, Ashby, many ATS
2. **Per-site adapters** — LinkedIn, Indeed, Workday, Glassdoor
3. **Generic fallback** — `og:title`, `og:site_name`, first `<h1>`, URL heuristics

The popup pre-fills an editable form — no field is ever saved without your
review.
