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

Several SRS screens are still placeholders. The landing page, sample course details and dashboard use mockup data; the course catalogue reads the API.

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
2. Run `npm install`.
3. Run `npm run dev` and open the address Vite prints.

Production build: `npm run build`.
