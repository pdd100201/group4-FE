const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../src/shared/utils/roleRoutes.ts'), 'utf8')
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exportsObject = {}
vm.runInNewContext(output, { exports: exportsObject, URL })
const { postLoginRoute } = exportsObject
const user = (...roles) => ({ roles })

test('admin falls back to dashboard for a manager-only return path', () => {
  assert.equal(postLoginRoute(user('ROLE_ADMIN'), '/manager/registrations'), '/dashboard')
})

test('admin keeps an authorized return path including filters', () => {
  assert.equal(postLoginRoute(user('ROLE_ADMIN'), '/admin/transactions?status=SUCCEEDED'),
    '/admin/transactions?status=SUCCEEDED')
})

test('manager cannot return to the admin dashboard', () => {
  assert.equal(postLoginRoute(user('ROLE_MANAGER'), '/dashboard'), '/manager/courses/review')
})

test('student and expert cannot return to admin pages', () => {
  assert.equal(postLoginRoute(user('ROLE_STUDENT'), '/admin/accounts'), '/student/courses')
  assert.equal(postLoginRoute(user('ROLE_EXPERT'), '/admin/reports'), '/expert/courses')
})

test('multiple roles permit a return path granted by either role', () => {
  assert.equal(postLoginRoute(user('ROLE_ADMIN', 'ROLE_MANAGER'), '/manager/registrations'),
    '/manager/registrations')
})

test('external, auth and normalized unauthorized paths fall back safely', () => {
  for (const requested of [undefined, 'https://example.com', '//example.com', '/\\example.com',
    '/login', '/forbidden', '/courses/../manager/transactions']) {
    assert.equal(postLoginRoute(user('ROLE_ADMIN'), requested), '/dashboard')
  }
})

test('public course return paths remain available to students', () => {
  assert.equal(postLoginRoute(user('ROLE_STUDENT'), '/courses/1?packageId=2'), '/courses/1?packageId=2')
})
