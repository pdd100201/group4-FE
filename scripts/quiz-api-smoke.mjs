import assert from 'node:assert/strict'
import { build } from 'vite'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

// Opt-in only: this test creates fixtures. Never run against a shared/user database.
if (process.env.QUIZ_TEST_ISOLATED !== 'true' || !process.env.QUIZ_TEST_API_URL) {
  throw new Error('Set QUIZ_TEST_ISOLATED=true and QUIZ_TEST_API_URL for a disposable backend before running this test.')
}
const api = process.env.QUIZ_TEST_API_URL
process.env.VITE_API_BASE_URL = api
const values = new Map()
globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
globalThis.sessionStorage = { getItem: () => null, removeItem: () => {} }
await build({ logLevel: 'error', build: { ssr: 'scripts/quiz-test-entry.ts', outDir: 'node_modules/.cache/quiz-api-smoke', emptyOutDir: false, rollupOptions: { output: { entryFileNames: 'entry.mjs' } } } })
const { quizService } = await import(pathToFileURL(resolve('node_modules/.cache/quiz-api-smoke/entry.mjs')).href)
async function denied(operation, allowedStatuses) {
  let status
  try { await operation() } catch (error) { status = error.response?.status }
  // Avoid dumping Axios errors, which contain Authorization headers.
  assert.ok(allowedStatuses.includes(status), `Expected denial ${allowedStatuses.join('/')}; received ${status ?? 'success/network error'}`)
}
async function request(path, method = 'GET', body, token = values.get('ols.accessToken')) {
  const response = await fetch(`${api}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const text = await response.text()
  return { status: response.status, data: text ? JSON.parse(text) : null }
}
async function login(role) {
  const response = await request('/auth/login', 'POST', { email: `${role}@onlinelearning.local`, password: 'Online@123' }, null)
  assert.equal(response.status, 200)
  return response.data.accessToken
}
values.set('ols.accessToken', await login('expert'))
const fixture = await request('/expert/courses', 'POST', { title: 'Quiz integration fixture', description: 'Disposable H2 test course', category: 'QA', price: 0 })
assert.equal(fixture.status, 201)
const courseId = fixture.data.id
const lesson = await request(`/expert/courses/${courseId}/lessons`, 'POST', { title: 'Lesson fixture', content: 'Test content', position: 1, active: true, videoMediaId: null })
assert.equal(lesson.status, 201)
const input = { title: 'Quiz frontend contract', durationMinutes: 15, passRate: 70, maxAttempts: 3, active: false, lessonId: lesson.data.id, questions: [] }
const created = await quizService.create(courseId, input)
assert.equal(created.lessonId, lesson.data.id)
assert.equal(created.courseId, courseId)
assert.equal((await quizService.lessons(courseId))[0].id, lesson.data.id)
console.log('PASS frontend service creates quiz with owned course/lesson')
const updated = await quizService.update(courseId, created.id, { ...input, title: 'Updated quiz', lessonId: null })
assert.equal(updated.title, 'Updated quiz'); assert.equal(updated.lessonId, null)
assert.equal((await quizService.get(courseId, created.id)).title, 'Updated quiz')
assert.equal((await quizService.list(courseId)).length, 1)
console.log('PASS frontend service updates and reads persisted quiz')
await denied(() => quizService.update(courseId, created.id, { ...input, durationMinutes: 0 }), [400])
await denied(() => quizService.create(courseId, { ...input, lessonId: 999999 }), [400])
console.log('PASS backend rejects invalid settings and foreign/missing lessons')
const managerToken = await login('manager')
values.set('ols.accessToken', managerToken)
const preview = await quizService.review(courseId)
assert.equal(preview.quizzes[0].title, 'Updated quiz')
assert.equal((await quizService.courses('manager', '', 0)).content.length, 0)
// The existing servlet error dispatch returns 401 for some role denials (MockMvc returns 403).
// Both must deny the mutation; correcting that shared security contract is outside this feature.
await denied(() => quizService.update(courseId, created.id, input), [401, 403])
await denied(() => quizService.remove(courseId, created.id), [401, 403])
console.log('PASS Manager read contract and write denial; draft excluded from review list')
values.set('ols.accessToken', await login('student'))
await denied(() => quizService.list(courseId), [401, 403])
console.log('PASS Student denied quiz management')
values.set('ols.accessToken', await login('expert'))
await quizService.remove(courseId, created.id)
await denied(() => quizService.get(courseId, created.id), [404])
console.log('PASS frontend service deletes unused quiz and confirms removal')
console.log('6 live API contract checks passed against disposable backend.')
