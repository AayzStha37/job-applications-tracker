# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A local-only, single-user job application tracker with three components: a Spring Boot backend, a React Kanban frontend, and a Chromium browser extension. No auth, no cloud — everything runs on `127.0.0.1`.

## Common Commands

### Docker (preferred)
```bash
docker compose up --build        # Start backend (:8081) + frontend (:5172)
docker compose down -v           # Stop and remove data volume
```

### Backend (bare-metal)
```bash
cd backend
./gradlew bootRun                # Start on :8081, SQLite at ./data/jobs.db
./gradlew test                   # Run tests (JUnit 5)
./gradlew build                  # Full build
```

### Frontend
```bash
cd frontend
npm install
npm run dev                      # Vite dev server on :5172
npm run build                    # Production build (tsc + vite)
npm run typecheck                # Type-check only (tsc -b --noEmit)
```

### Extension
```bash
cd extension
npm install
npm run build                    # esbuild via scripts/build.mjs -> dist/
npm run typecheck                # tsc --noEmit
```
Load `extension/dist` as unpacked extension in Chrome/Edge/Brave.

## Architecture

### Backend (`backend/`)
- **Spring Boot 3.3 / Java 21** with SQLite (via `sqlite-jdbc` + Hibernate community dialect)
- **Flyway** manages migrations in `src/main/resources/db/migration/`
- Single domain package: `com.jobtracker.application` — contains entity, repository, service, controller, DTOs, and Status enum
- **Dedup logic**: POST to `/applications` with matching `(source, externalJobId)` returns the existing row (200) instead of creating a duplicate (201)
- CORS configured in `com.jobtracker.config.CorsConfig`
- Application config in `src/main/resources/application.yml`

### Frontend (`frontend/`)
- **React 18 + Vite + TypeScript**
- **@dnd-kit** for drag-and-drop between Kanban columns
- **@tanstack/react-query** for data fetching with optimistic updates (`useApplications` hook)
- API client in `src/api/applications.ts` — hardcoded to `http://127.0.0.1:8081`
- Components: `Board` (Kanban layout) > `Column` (status lane) > `Card` (single application) + `CardDetailDrawer` (notes/delete)

### Extension (`extension/`)
- **Chromium MV3** browser extension, built with esbuild
- Extracts job data from the current page using a pipeline of adapters (first non-empty value wins):
  1. JSON-LD `JobPosting` schema
  2. Site-specific adapters: LinkedIn, Indeed, Workday, Glassdoor
  3. Generic fallback (Open Graph tags, `<h1>`, URL heuristics)
- Popup shows an editable form; saves to backend via POST `/applications`
- Adapter source files: `src/extractor/adapters/`

### Data Flow
Extension extracts job data -> POSTs to backend `/applications` -> Frontend polls backend every 30s and on window focus -> Kanban board renders cards -> Drag-and-drop PATCHes status

## Key Conventions

- **Statuses**: `APPLIED`, `SCREEN`, `INTERVIEW`, `OFFER`, `REJECTED`, `WITHDRAWN` (defined in `Status.java` enum, mirrored in frontend `types.ts`)
- **Ports**: backend=8081, frontend=5172 (both in Docker and bare-metal)
- New DB schema changes go in `backend/src/main/resources/db/migration/` following Flyway naming (`V{n}__{description}.sql`)
- Extension has no runtime dependencies — only devDependencies (esbuild, TypeScript, `@types/chrome`)
