import { createRequire } from 'node:module'
import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'

// Isolated browser fixtures: no real account, upload or database write.
const { chromium } = createRequire(import.meta.url)('playwright')
const base = process.env.OLS_QA_URL || 'http://127.0.0.1:15174'
const server = process.env.OLS_QA_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '15174', '--strictPort'], { stdio: 'ignore' })
if (server) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(base)).ok) break } catch { /* Wait for the local test server. */ }
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
try {
  for (const [role, managementRole] of [['ROLE_MANAGER', 'manager'], ['ROLE_ADMIN', 'admin'], ['ROLE_STUDENT', null], ['ROLE_EXPERT', null]]) {
    const context = await browser.newContext()
    await context.addInitScript(role => {
      localStorage.setItem('ols.accessToken', 'fixture-token')
      localStorage.setItem('ols.user', JSON.stringify({ id: 1, email: 'fixture@test.local', fullName: 'Fixture', roles: [role] }))
    }, role)
    const requests = []
    await context.route('**/api/v1/**', route => {
      const request = route.request(), pathname = new URL(request.url()).pathname
      const json = body => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
      if (pathname === '/api/v1/media') return json({ id: 42, url: null, resourceType: 'image', bytes: 1 })
      if (request.method() === 'POST') {
        requests.push({ pathname, body: request.postDataJSON() })
        return json({ post: { id: 99 }, status: 'PUBLISHED' })
      }
      if (pathname.endsWith('/categories')) return json([])
      return json({ content: [], totalElements: 0, totalPages: 0, number: 0 })
    })
    const page = await context.newPage()
    await page.goto(base + '/blog')
    await page.getByRole('link', { name: managementRole ? '✎ Tạo bài viết' : '✎ Gửi bài viết', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Gửi Manager kiểm duyệt', exact: true }).count(), managementRole ? 0 : 1)
    for (const draft of managementRole ? [false, true] : [false]) {
      await page.goto(base + '/blog/submit')
      await page.getByLabel('Tiêu đề *', { exact: true }).fill('Bài kiểm tra')
      await page.getByLabel('Danh mục *', { exact: true }).fill('Lập trình')
      await page.getByLabel('Tóm tắt *', { exact: true }).fill('Tóm tắt kiểm tra')
      await page.getByLabel('Nội dung bài viết *', { exact: true }).fill('Nội dung kiểm tra')
      if (draft) await page.getByLabel('Trạng thái').selectOption('draft')
      else {
        await page.getByLabel('Tải ảnh lên').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: Buffer.from([0]) })
        await page.getByText('Đã tải lên.', { exact: false }).waitFor()
      }
      await page.getByRole('button', { name: managementRole ? draft ? 'Lưu bản nháp' : 'Xuất bản bài viết' : 'Gửi Manager kiểm duyệt', exact: true }).click()
      await page.waitForURL(managementRole ? `**/${managementRole}/posts` : '**/blog/my-submissions?submitted=1')
      const request = requests.at(-1)
      assert.equal(request.pathname, managementRole ? `/api/v1/${managementRole}/posts` : '/api/v1/posts/submissions')
      assert.equal(request.body.published, managementRole ? !draft : undefined)
      assert.equal(request.body.thumbnailMediaId, draft ? null : 42)
    }
    console.log(`PASS ${role}: ${managementRole ? 'direct publish and draft' : 'moderation submission'}`)
    await context.close()
  }
} finally { await browser.close(); server?.kill() }
