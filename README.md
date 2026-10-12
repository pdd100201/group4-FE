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
# Quiz Management

Expert: open `/expert/quizzes`, choose an owned course, then view/create/edit/delete its quizzes. Optional lesson selection comes from the course's lesson API. Quiz writes are available only for Draft/Rejected courses; the backend enforces ownership and retained attempts/results. Failed writes preserve form input and show the API error. Deletion requires confirmation and succeeds only after the API completes.

Manager: open `/manager/courses/review/quizzes` or `/manager/courses/:courseId/review/quizzes`. Only Pending Review course quizzes are rendered; the page shows questions, answer options and explanations without mutation controls. No approval/rejection workflow is implemented here.

Question links currently use existing question IDs because the backend has no Question Bank list endpoint. Quiz level/type fields and server pagination are also unavailable in the existing contract; the quiz list uses client-side name/status filtering and pagination over the returned course quizzes. Retention eligibility is checked by the backend when saving/deleting because it is not included in the response DTO.

Verification:

```powershell
npm run lint
npx tsc --noEmit
npm run build
npm run test:quiz
```

The render checks use fixtures only inside the test scripts; production components use API data. They check role restrictions, course-state locks, preview-only Manager access and safe text rendering. They are not a browser interaction or visual-layout test.

For live API contract checks, start a disposable backend with H2 and demo users. Never point this test at a shared database:

```powershell
$env:QUIZ_TEST_ISOLATED='true'
$env:QUIZ_TEST_API_URL='http://127.0.0.1:18080/api/v1'
npm run test:quiz:api
```

The live checks cover typed service CRUD, optional lesson association, invalid inputs and denied Manager/Student mutations. The shared backend may return 401 instead of 403 for servlet-dispatched role errors; both must deny the write. Retention is covered by the existing backend `ExpertQuizIntegrationTests`; this frontend change does not alter the backend rules.
