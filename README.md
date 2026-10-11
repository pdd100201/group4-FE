# Online Learning Web

React + Vite + TypeScript client for the Online Learning System SRS. It provides public, student, expert, manager, and administrator route groups, Axios, React Query, and role guards.

## Package architecture

```text
public/                  Static files served by Vite
src/routes/              URL definitions and role boundaries
src/features/
  auth/                  Authentication API, screens, components, context, utils, types
  courses/               Course API, query hooks and screens
  home/                  Home screen and existing sample data
  dashboard/             Existing dashboard screen
  management/            Registration/transaction API, query hooks, screens and types
  <feature>/api/         Feature-specific REST API functions
  <feature>/screens/     Feature pages and their CSS
  <feature>/hooks/       Feature-specific React Query hooks, when needed
  <feature>/types/       Feature-specific TypeScript contracts, when needed
src/shared/components/
  layout/                Layouts shared across route groups
  ui/                    Shared UI components
src/shared/services/     Axios instance and token interceptors
```

The data path is `routes -> feature screens -> feature hooks -> feature api -> shared apiClient -> Backend REST API`. For example, the course catalogue uses `CourseCatalogPage -> usePublishedCourses -> courseApi -> GET /api/v1/public/courses`. Shared layouts live in `shared/components/layout`. Generic hooks belong in `shared/hooks` when introduced; feature-specific hooks stay with their feature. Keep TypeScript (`.ts`/`.tsx`) rather than converting to JavaScript.

Several SRS screens are still placeholders. The landing page, sample course details and dashboard use mockup data; the course catalogue reads the API.

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
2. Run `npm install`.
3. Run `npm run dev` and open the address Vite prints.

Production build: `npm run build`.
