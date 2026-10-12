# Online Learning Web

React + Vite + TypeScript client for the Online Learning System SRS. It provides public, student, expert, manager, and administrator route groups, Axios, React Query, and role guards.

## Package architecture

```text
public/                  Static files served by Vite
src/routes/              URL definitions and role boundaries
src/features/
  auth/                  Authentication API and screens
  courses/               Course API and screens
  home/                  Home screen
  dashboard/             Existing dashboard screen
  management/            Registration/transaction API and screens
  reports/               Admin report API and screens (UC50-54)
  expert/                Expert course/lesson API and editing screens
  registrations/         Student registration API and confirmation/list/detail screens
  media/                 Image/video upload and playback API
  <feature>/api/         Feature-specific REST API functions
  <feature>/screens/     Feature pages and their CSS
src/shared/components/
  layout/                Layouts shared across route groups
  ui/                    Shared UI components
src/shared/services/     Axios instance and token interceptors
src/shared/hooks/        React Query hooks
src/shared/context/      Auth provider and session state
src/shared/types/        TypeScript contracts and global declarations
src/shared/utils/        Auth storage and role routing utilities
src/shared/data/         Existing sample data shared by home and dashboard
```

Each feature contains only `api` and `screens` when needed; do not create empty API folders for screens without an API. The data path is `routes -> feature screens -> shared hooks -> feature api -> shared apiClient -> Backend REST API`. For example, the course catalogue uses `CourseCatalogPage -> usePublishedCourses -> courseApi -> GET /api/v1/public/courses`. Shared layouts live in `shared/components/layout`, and auth controls in `shared/components/auth`. Keep TypeScript (`.ts`/`.tsx`) rather than converting to JavaScript.

The home course cards, course catalogue and course details read published-course APIs. Expert course/lesson editing, package pricing, submission checks, Manager course review, and Admin/Manager course moderation use real APIs. Students select 1-month/1-year/lifetime packages, create pending registrations, and view their own stored registration details. Registration/transaction list, detail and filters remain available through the management feature. Dashboard and other unfinished SRS screens remain placeholders or mockup data; Student learning is not implemented. Payment uses SePay bank-transfer QR only, displayed on the standalone payment page. Server polling confirms status after an authenticated matching webhook; no redirect, card checkout or Student-controlled confirmation exists. Test Mode is the default; bank configuration and a reachable webhook are required. See backend `docs/SEPAY_SETUP.md`. Registration schema setup is documented in `docs/STUDENT_REGISTRATION_PAYMENT_HANDOFF.md`.

Shared media controls live in `shared/components/media`, query hooks in `shared/hooks`, and feature API calls in each feature's `api` directory. Keep this structure when extending the merged Course code; do not recreate top-level `src/services`, `src/hooks` or `src/components` folders.

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
2. Run `npm install`.
3. Run `npm run dev` and open the address Vite prints.

Production build: `npm run build`.

Shared team testing: `npm run dev:team` uses the owner's ngrok backend and database,
without changing normal local `.env` settings. The owner must keep BE and ngrok
running. Override its public API URL using `OLS_TEAM_API_URL` if necessary; never
put SePay webhook keys in frontend configuration. Use frontend port 5173 or explicitly
allow the actual frontend origin in backend CORS settings.
