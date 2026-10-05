# Online Learning Web

React + Vite + TypeScript client for the Online Learning System SRS. It provides public, student, expert, manager, and administrator route groups, Axios, React Query, and role guards.

## Package architecture

```text
public/         Static files served by Vite
src/routes/     URL definitions and role boundaries
src/features/   Pages grouped by business area (public, auth, management)
src/components/ Shared layouts and route guard
src/hooks/      React Query hooks for feature data
src/services/   REST API functions
src/api/        Axios instance and token interceptors
src/types/      Shared TypeScript contracts
```

The data path is `routes → features → hooks → services → apiClient → Backend REST API`. For example, the course catalogue uses `CourseCatalogPage → usePublishedCourses → courseService → GET /api/v1/public/courses`. Shared layouts live in `components`.

Several SRS screens are still placeholders. The landing page, sample course details and dashboard use mockup data; the course catalogue reads the API.

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
2. Run `npm install`.
3. Run `npm run dev` and open the address Vite prints.

Production build: `npm run build`.
