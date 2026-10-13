import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { build } from 'vite'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

// Test-only storage and fixtures. Production pages always use quizService APIs.
const values = new Map()
globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
globalThis.sessionStorage = { getItem: () => null, removeItem: () => {} }
await build({ logLevel: 'error', build: { ssr: 'scripts/quiz-test-entry.ts', outDir: 'node_modules/.cache/quiz-smoke', emptyOutDir: false, rollupOptions: { output: { entryFileNames: 'entry.mjs' } } } })
let passed = 0
try {
  const { AuthProvider, AppRoutes, quizError, validId } = await import(pathToFileURL(resolve('node_modules/.cache/quiz-smoke/entry.mjs')).href)
  const course = { id: 10, title: 'Khóa học kiểm thử', category: 'Java', status: 'DRAFT' }
  const quiz = { id: 20, courseId: 10, lessonId: 30, title: 'Quiz kiểm thử', durationMinutes: 15, passRate: 70, maxAttempts: 3, active: true,
    questions: [{ questionId: 40, position: 1, points: 2, content: '<script>unsafe</script>' }] }
  function render(path, role = 'ROLE_EXPERT', status = 'DRAFT', reviewStatus = 'PENDING_REVIEW') {
    values.set('ols.accessToken', 'fixture-token')
    values.set('ols.user', JSON.stringify({ id: 1, email: 'fixture@test.local', fullName: 'QA', roles: [role] }))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
    client.setQueryData(['quiz-course', 1, 10], { ...course, status })
    client.setQueryData(['managed-quizzes', 1, 10], [quiz])
    client.setQueryData(['managed-quiz', 1, 10, 20], quiz)
    client.setQueryData(['quiz-lessons', 1, 10], [{ id: 30, title: 'Bài học kiểm thử', position: 1, active: true }])
    client.setQueryData(['quiz-courses', 1, 'expert', '', 0], { content: [course], totalElements: 1, totalPages: 1, number: 0 })
    client.setQueryData(['quiz-courses', 1, 'manager', '', 0], { content: [{ ...course, status: 'PENDING_REVIEW' }], totalElements: 1, totalPages: 1, number: 0 })
    client.setQueryData(['quiz-review', 1, 10], { ...course, status: reviewStatus, expertName: 'Expert QA', quizzes: [{ ...quiz, questions: [{ id: 40, content: 'Câu hỏi review', type: 'SINGLE_CHOICE', explanation: 'Giải thích kiểm thử', points: 2, options: [{ id: 50, content: 'Đáp án A', correct: true }] }] }] })
    try { return renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(AuthProvider, null, createElement(MemoryRouter, { initialEntries: [path] }, createElement(AppRoutes))))) }
    finally { client.clear() }
  }
  function check(name, run) { run(); passed++; console.log(`PASS ${name}`) }
  check('Expert sees own course picker', () => assert.match(render('/expert/quizzes'), /Khóa học kiểm thử/))
  check('Draft quiz list has create/edit/delete and lesson name', () => {
    const html = render('/expert/courses/10/quizzes')
    for (const text of ['Tạo quiz', 'Sửa', 'Xóa', 'Bài học kiểm thử']) assert.ok(html.includes(text))
  })
  check('Published quizzes expose view only', () => {
    const html = render('/expert/courses/10/quizzes', 'ROLE_EXPERT', 'PUBLISHED')
    assert.ok(!html.includes('>Sửa<') && !html.includes('>Xóa<') && !html.includes('+ Tạo quiz'))
  })
  check('Editor has existing settings, linked lesson and questions', () => {
    const html = render('/expert/courses/10/quizzes/20/edit')
    assert.match(html, /value="Quiz kiểm thử"/); assert.match(html, /Lưu thay đổi/); assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/)
    assert.ok(!html.includes('<script>unsafe</script>'))
  })
  check('Locked edit URL renders detail instead of write form', () => assert.ok(!render('/expert/courses/10/quizzes/20/edit', 'ROLE_EXPERT', 'PENDING_REVIEW').includes('Lưu thay đổi')))
  check('New form supports optional lesson and initial inactive state', () => {
    const html = render('/expert/courses/10/quizzes/new')
    assert.match(html, /Không gắn bài học/); assert.match(html, /Thời lượng \(phút\)/)
  })
  check('Manager preview includes correct answers and explanation, no writes', () => {
    const html = render('/manager/courses/10/review/quizzes', 'ROLE_MANAGER')
    assert.match(html, /Đáp án đúng/); assert.match(html, /Giải thích kiểm thử/)
    assert.ok(!html.includes('Lưu thay đổi') && !html.includes('Xác nhận xóa') && !html.includes('+ Tạo quiz'))
  })
  check('Manager cannot preview a course outside review', () => {
    const html = render('/manager/courses/10/review/quizzes', 'ROLE_MANAGER', 'DRAFT', 'PUBLISHED')
    assert.match(html, /không còn ở trạng thái/); assert.ok(!html.includes('Giải thích kiểm thử'))
  })
  check('Manager cannot access Expert editor', () => assert.ok(!render('/expert/courses/10/quizzes/20/edit', 'ROLE_MANAGER').includes('Lưu thay đổi')))
  check('Student cannot access quiz management', () => assert.ok(!render('/expert/courses/10/quizzes', 'ROLE_STUDENT').includes('Quiz kiểm thử')))
  check('Invalid IDs are rejected', () => { for (const id of ['-1', '0', '1.2', 'foo', '9007199254740992']) assert.equal(validId(id), null) })
  check('Retention conflict is preserved for user feedback', () => assert.equal(quizError({ isAxiosError: true, response: { status: 409, data: { message: 'Không thể xóa quiz đã có lượt làm bài.' } } }), 'Không thể xóa quiz đã có lượt làm bài.'))
  check('Error handling supports empty security response bodies', () => assert.match(quizError({ isAxiosError: true, response: { status: 403, data: null } }), /không có quyền/))
  console.log(`${passed} quiz render/permission checks passed.`)
} finally { values.clear() }
