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
  const assessment = { ...quiz, lessonId: null, retained: false, questions: [{ questionId: 40, points: 2,
    question: { content: '<script>unsafe</script>', type: 'SINGLE_CHOICE', active: true, options: [{ content: 'Đáp án A', correct: true }] } }] }
  const studio = '/expert/courses/10?step=content&tab=quiz'
  function render(path, role = 'ROLE_EXPERT', status = 'DRAFT', reviewStatus = 'PENDING_REVIEW', assessments = [assessment]) {
    values.set('ols.accessToken', 'fixture-token')
    values.set('ols.user', JSON.stringify({ id: 1, email: 'fixture@test.local', fullName: 'QA', roles: [role] }))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
    client.setQueryData(['expert-course', 10], { ...course, status, editable: status === 'DRAFT' })
    client.setQueryData(['course-assessment', 1, 10], assessments)
    client.setQueryData(['quiz-review', 1, 10], { ...course, status: reviewStatus, expertName: 'Expert QA', quizzes: [{ ...quiz, questions: [{ id: 40, content: 'Câu hỏi review', type: 'SINGLE_CHOICE', explanation: 'Giải thích kiểm thử', points: 2, options: [{ id: 50, content: 'Đáp án A', correct: true }] }] }] })
    try { return renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(AuthProvider, null, createElement(MemoryRouter, { initialEntries: [path] }, createElement(AppRoutes))))) }
    finally { client.clear() }
  }
  function check(name, run) { run(); passed++; console.log(`PASS ${name}`) }
  check('Draft course studio opens the final quiz editor', () => {
    const html = render(studio)
    assert.match(html, /aria-pressed="true">Quiz cuối khóa/)
    assert.match(html, /value="Quiz kiểm thử"/)
    assert.match(html, /Lưu quiz và câu hỏi/)
    assert.ok(html.includes('&lt;script&gt;unsafe&lt;/script&gt;'))
    assert.ok(!html.includes('<script>unsafe</script>'))
  })
  check('Published and pending-review courses show the quiz read-only', () => {
    for (const status of ['PUBLISHED', 'PENDING_REVIEW']) {
      const html = render(studio, 'ROLE_EXPERT', status)
      assert.match(html, /value="Quiz kiểm thử"/)
      assert.match(html, /<fieldset disabled=""><legend>Cấu hình quiz/)
      assert.doesNotMatch(html, /Lưu quiz và câu hỏi|Thêm câu hỏi/)
    }
  })
  check('A course without a quiz shows the initial editor', () => {
    const html = render(studio, 'ROLE_EXPERT', 'DRAFT', 'PENDING_REVIEW', [])
    assert.match(html, /Chưa tạo quiz/)
    assert.match(html, /Thêm câu hỏi/)
    assert.ok(html.includes('Thời lượng (phút)'))
  })
  check('Legacy quizzes with attempts cannot be deleted', () => {
    const html = render(studio, 'ROLE_EXPERT', 'DRAFT', 'PENDING_REVIEW', [
      { ...assessment, retained: true }, { ...assessment, id: 21, title: 'Quiz cũ chưa có lượt làm' },
    ])
    assert.match(html, /Khóa học cũ có 2 quiz/)
    assert.match(html, /Đã có lượt làm bài/)
    assert.equal((html.match(/>Xóa quiz này</g) ?? []).length, 1)
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
  check('Manager cannot access Expert editor', () => assert.ok(!render(studio, 'ROLE_MANAGER').includes('Quiz kiểm thử')))
  check('Student cannot access quiz management', () => assert.ok(!render(studio, 'ROLE_STUDENT').includes('Quiz kiểm thử')))
  check('Invalid IDs are rejected', () => { for (const id of ['-1', '0', '1.2', 'foo', '9007199254740992']) assert.equal(validId(id), null) })
  check('Retention conflict is preserved for user feedback', () => assert.equal(quizError({ isAxiosError: true, response: { status: 409, data: { message: 'Không thể xóa quiz đã có lượt làm bài.' } } }), 'Không thể xóa quiz đã có lượt làm bài.'))
  check('Error handling supports empty security response bodies', () => assert.match(quizError({ isAxiosError: true, response: { status: 403, data: null } }), /không có quyền/))
  console.log(`${passed} quiz render/permission checks passed.`)
} finally { values.clear() }
