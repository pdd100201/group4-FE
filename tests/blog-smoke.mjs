import { createRequire } from 'node:module'
import { strict as assert } from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path'

// Browser fixtures only; production screens always call the REST API.
// Use an existing Playwright installation via NODE_PATH; no project dependency is added.
const { chromium } = createRequire(import.meta.url)('playwright')
const base = process.env.OLS_QA_URL || 'http://127.0.0.1:15173'
const output = path.resolve(process.env.OLS_QA_OUTPUT || 'test-results/blog')
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: process.env.OLS_QA_BROWSER || 'chrome' })
const posts = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1, title: `Bài viết Java ${String(i + 1).padStart(2, '0')}`, category: i < 12 ? 'Lập trình' : 'Thiết kế',
  thumbnailUrl: null, summary: 'Kiến thức và kinh nghiệm học tập.', authorName: 'Tác giả thử nghiệm',
  createdAt: '2026-10-11T08:00:00Z', updatedAt: '2026-10-11T09:00:00Z',
})).reverse()
let comments = [{ id: 1, postId: 1, postTitle: 'Bài viết Java 01', authorName: 'Học viên thử nghiệm', avatarUrl: null,
  content: 'Bình luận gốc', status: 'VISIBLE', createdAt: '2026-10-11T09:00:00Z', updatedAt: '2026-10-11T09:00:00Z' }]
let mode = 'ok'
const seenRequests = []
async function contextFor(role) {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } })
  if (role) await context.addInitScript(role => {
    localStorage.setItem('ols.accessToken', 'test-fixture-token')
    localStorage.setItem('ols.user', JSON.stringify({ id: 1, email: 'fixture@test.local', fullName: 'Học viên thử nghiệm', roles: [role] }))
  }, role)
  await context.route('https://fonts.googleapis.com/**', route => route.abort())
  await context.route('**/api/v1/**', async route => {
    const req = route.request(), url = new URL(req.url()), method = req.method()
    seenRequests.push(method + ' ' + url.pathname + url.search)
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    const permissions = c => ({ ...c, canEdit: role === 'ROLE_STUDENT', canDelete: ['ROLE_STUDENT', 'ROLE_MANAGER', 'ROLE_ADMIN'].includes(role) })
    if (url.pathname === '/api/v1/public/courses') return json([{ id: 7, title: 'Java cơ bản', description: 'Khóa học Java', category: 'Lập trình', price: 200000, thumbnailUrl: null, expertName: 'Giảng viên thử nghiệm' }])
    if (url.pathname === '/api/v1/public/posts/categories') return json(['Lập trình', 'Thiết kế'])
    if (url.pathname === '/api/v1/public/posts') {
      if (mode === 'error') return json({ message: 'Test outage' }, 503)
      if (mode === 'empty') return json({ content: [], totalElements: 0, totalPages: 0, number: 0 })
      let results = posts.filter(p => (!url.searchParams.get('search') || p.title.includes(url.searchParams.get('search'))) && (!url.searchParams.get('category') || p.category === url.searchParams.get('category')))
      const page = Number(url.searchParams.get('page') || 0), size = Number(url.searchParams.get('size') || 9)
      return json({ content: results.slice(page * size, (page + 1) * size), totalElements: results.length, totalPages: Math.ceil(results.length / size), number: page })
    }
    if (url.pathname === '/api/v1/public/posts/1') return json({ post: posts.find(p => p.id === 1), content: '<h2>Nội dung bài viết</h2><p>Kiến thức Java <strong>an toàn</strong>.</p><script>window.__olsXss=1</script><a href="javascript:window.__olsXss=2">Liên kết nguy hiểm</a><img src=x onerror="window.__olsXss=3">' })
    if (url.pathname === '/api/v1/public/posts/1/comments') return json({ content: comments.map(permissions), totalElements: comments.length, totalPages: comments.length ? 1 : 0, number: 0 })
    const detail = url.pathname.match(/^\/api\/v1\/public\/posts\/1\/comments\/(\d+)$/)
    if (detail) {
      const comment = comments.find(c => c.id === Number(detail[1]))
      return comment ? json(permissions(comment)) : json({ message: 'Unavailable' }, 404)
    }
    if (url.pathname === '/api/v1/student/posts/1/comments' && method === 'POST') {
      const c = { ...comments[0], id: 2, postId: 1, postTitle: 'Bài viết Java 01', authorName: 'Học viên thử nghiệm', avatarUrl: null,
        status: 'VISIBLE', createdAt: '2026-10-11T09:00:00Z', updatedAt: '2026-10-11T09:00:00Z', content: req.postDataJSON().content }
      comments.push(c); return json(permissions(c), 201)
    }
    const edit = url.pathname.match(/^\/api\/v1\/student\/comments\/(\d+)$/)
    if (edit && method === 'PUT') {
      const c = comments.find(c => c.id === Number(edit[1])); c.content = req.postDataJSON().content; return json(permissions(c))
    }
    const remove = url.pathname.match(/^\/api\/v1\/comments\/(\d+)$/)
    if (remove && method === 'DELETE') { comments = comments.filter(c => c.id !== Number(remove[1])); return route.fulfill({ status: 204 }) }
    return json({ message: 'Unexpected fixture request' }, 404)
  })
  return context
}
try {
  const guest = await contextFor(null), page = await guest.newPage(), errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(base)
  await page.getByRole('heading', { name: 'Bài Viết Mới Nhất' }).waitFor()
  await page.locator('.home-post').first().waitFor()
  assert.equal(await page.locator('.home-post').count(), 3)
  await page.screenshot({ path: path.join(output, 'home-desktop.png'), fullPage: true })
  await page.getByRole('textbox', { name: 'Tìm kiếm khóa học' }).fill('Java')
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click()
  await page.waitForURL('**/courses?search=Java')
  await page.locator('.course-card').waitFor()
  assert(seenRequests.some(req => req.includes('/public/courses?search=Java')))
  await page.goto(base + '/blog')
  await page.locator('.blog-post-card').first().waitFor()
  await page.getByRole('button', { name: 'Lập trình', exact: true }).click()
  await page.waitForURL('**/blog?category=*')
  await page.getByRole('button', { name: 'Sau', exact: true }).click()
  await page.waitForURL('**page=1')
  assert.equal(new URL(page.url()).searchParams.get('category'), 'Lập trình')
  await page.getByRole('textbox', { name: 'Tìm bài viết' }).fill('01')
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click()
  await page.waitForURL('**search=01')
  await page.waitForFunction(() => document.querySelectorAll('.blog-post-card').length === 1)
  assert.equal(await page.locator('.blog-post-card').count(), 1)
  assert.equal(new URL(page.url()).searchParams.has('page'), false)
  await page.screenshot({ path: path.join(output, 'blog-list-desktop.png'), fullPage: true })
  await page.goto(base + '/blog/1')
  await page.getByText('Bình luận gốc', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Sửa', exact: true }).count(), 0)
  assert.equal(await page.evaluate(() => window.__olsXss), undefined)
  assert.equal(await page.locator('.blog-content script, .blog-content img, .blog-content a[href^="javascript:"]').count(), 0)
  await page.getByRole('button', { name: 'Xem chi tiết' }).click()
  await page.getByRole('heading', { name: 'Chi tiết bình luận' }).waitFor()
  await page.screenshot({ path: path.join(output, 'blog-detail-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: path.join(output, 'blog-detail-mobile.png'), fullPage: true })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
  const student = await contextFor('ROLE_STUDENT'), sp = await student.newPage()
  sp.on('dialog', dialog => dialog.accept())
  await sp.goto(base + '/blog/1')
  await sp.getByRole('button', { name: 'Sửa', exact: true }).waitFor()
  await sp.getByLabel('Chia sẻ ý kiến của bạn').fill('<script>test</script> Bình luận mới')
  await sp.getByRole('button', { name: 'Gửi bình luận' }).click()
  await sp.getByText('<script>test</script> Bình luận mới', { exact: true }).waitFor()
  assert.equal(await sp.locator('.blog-comments script').count(), 0)
  await sp.getByRole('button', { name: 'Sửa', exact: true }).first().click()
  await sp.getByLabel('Sửa bình luận').fill('Đã cập nhật qua API')
  await sp.getByRole('button', { name: 'Lưu', exact: true }).click()
  await sp.getByText('Đã cập nhật qua API', { exact: true }).waitFor()
  await sp.getByRole('button', { name: 'Xóa', exact: true }).first().click()
  await sp.getByText('Đã xóa bình luận.', { exact: true }).waitFor()
  assert.equal(comments.length, 1)
  for (const role of ['ROLE_EXPERT', 'ROLE_MANAGER', 'ROLE_ADMIN']) {
    const actor = await contextFor(role), actorPage = await actor.newPage()
    await actorPage.goto(base + '/blog/1')
    await actorPage.locator('.blog-comment').waitFor()
    assert.equal(await actorPage.getByRole('button', { name: 'Sửa', exact: true }).count(), 0)
    assert.equal(await actorPage.getByRole('button', { name: 'Gửi bình luận', exact: true }).count(), 0)
    assert.equal(await actorPage.getByRole('button', { name: 'Xóa', exact: true }).count(), role === 'ROLE_EXPERT' ? 0 : 1)
    await actor.close()
  }
  mode = 'empty'
  await page.goto(base + '/blog?search=empty-test')
  await page.getByText('Không tìm thấy bài viết phù hợp.', { exact: true }).waitFor()
  mode = 'error'
  await page.goto(base + '/blog?search=error-test')
  await page.getByText('Không tải được bài viết.', { exact: false }).first().waitFor({ timeout: 20000 })
  assert.deepEqual(errors, [])
  console.log('PASS: Home search; blog filters/paging; guest/Student permissions; comment create/edit/delete/detail; XSS; empty/error; mobile overflow.')
} finally { await browser.close() }
