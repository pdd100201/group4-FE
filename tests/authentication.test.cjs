const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const test = require('node:test')
const ts = require('typescript')

function load(file, globals = {}, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, URL, ...globals, require(name) {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`)
    return dependencies[name]
  } })
  return exports
}

const roleRoutes = load('src/shared/utils/roleRoutes.ts')
const destinations = [
  ['ROLE_ADMIN', '/dashboard'], ['ROLE_MANAGER', '/manager/courses/review'],
  ['ROLE_EXPERT', '/expert/courses'], ['ROLE_STUDENT', '/'],
]
for (const [role, expected] of destinations) {
  test(`UC01 ${role} lands on its authorized page`, () => {
    assert.equal(roleRoutes.landingRoute({ roles: [role] }), expected)
  })
}

for (const requested of ['/admin/accounts', '/manager/courses/review', '/expert/courses', '/dashboard']) {
  test(`UC01 Student cannot return to ${requested}`, () => {
    assert.equal(roleRoutes.postLoginRoute({ roles: ['ROLE_STUDENT'] }, requested), '/')
  })
}
for (const requested of ['https://evil.example.test', '//evil.example.test', '/\\evil.example.test', '/login', '/reset-password?token=old']) {
  test(`UC01 unsafe or authentication return URL is rejected: ${requested}`, () => {
    assert.equal(roleRoutes.postLoginRoute({ roles: ['ROLE_EXPERT'] }, requested), '/expert/courses')
  })
}
test('UC01 valid Student registration intent survives login', () => {
  const route = '/student/courses/12/register?packageId=4'
  assert.equal(roleRoutes.postLoginRoute({ roles: ['ROLE_STUDENT'] }, route), route)
  assert.equal(roleRoutes.registrationReturnRoute({ roles: ['ROLE_STUDENT'] }, route), route)
  assert.equal(roleRoutes.registrationReturnRoute({ roles: ['ROLE_MANAGER'] }, route), null)
})

function storage() {
  const values = new Map()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }
}
function sessionFixture() {
  const localStorage = storage(), sessionStorage = storage()
  const { authStorage } = load('src/shared/utils/authStorage.ts', { localStorage, sessionStorage })
  const tokens = { accessToken: 'access', refreshToken: 'refresh', userId: 7, email: 'unit@example.test', fullName: 'Student', roles: ['ROLE_STUDENT'] }
  return { authStorage, localStorage, sessionStorage, tokens }
}
for (const remember of [true, false]) {
  test(`UC01 remember=${remember} stores session in the correct browser storage`, () => {
    const { authStorage, localStorage, sessionStorage, tokens } = sessionFixture()
    authStorage.save(tokens, remember)
    assert.equal((remember ? localStorage : sessionStorage).getItem('ols.accessToken'), 'access')
    assert.equal((remember ? sessionStorage : localStorage).getItem('ols.accessToken'), null)
    assert.equal(authStorage.user().id, 7)
    authStorage.updateTokens({ accessToken: 'rotated-access', refreshToken: 'rotated-refresh' })
    assert.equal((remember ? localStorage : sessionStorage).getItem('ols.refreshToken'), 'rotated-refresh')
  })
}
test('UC72 logout clears OLS session from both storage areas and preserves unrelated data', () => {
  const { authStorage, localStorage, sessionStorage, tokens } = sessionFixture()
  authStorage.save(tokens, true)
  sessionStorage.setItem('ols.refreshToken', 'stale-refresh')
  for (const target of [localStorage, sessionStorage]) target.setItem('other-app', 'keep')
  authStorage.clear()
  assert.equal(authStorage.user(), null)
  for (const target of [localStorage, sessionStorage]) {
    assert.equal(target.getItem('other-app'), 'keep')
    for (const key of ['ols.accessToken', 'ols.refreshToken', 'ols.user']) assert.equal(target.getItem(key), null)
  }
})
test('UC01 malformed saved user is discarded safely', () => {
  const { authStorage, localStorage } = sessionFixture()
  localStorage.setItem('ols.accessToken', 'access'); localStorage.setItem('ols.user', '{broken')
  assert.equal(authStorage.user(), null); assert.equal(authStorage.accessToken(), null)
})
test('UC72 saved user without access token does not restore login', () => {
  const { authStorage, localStorage } = sessionFixture()
  localStorage.setItem('ols.user', JSON.stringify({ id: 7, roles: ['ROLE_STUDENT'] }))
  assert.equal(authStorage.user(), null)
})

for (const [method, args, endpoint, body] of [
  ['login', ['unit@example.test', 'StrongPass123'], '/auth/login', { email: 'unit@example.test', password: 'StrongPass123' }],
  ['googleLogin', ['credential'], '/auth/google', { credential: 'credential' }],
  ['register', [{ fullName: 'Student', email: 'unit@example.test', password: 'StrongPass123' }], '/auth/register', { fullName: 'Student', email: 'unit@example.test', password: 'StrongPass123' }],
  ['verifyEmail', ['verification'], '/auth/verify-email', { token: 'verification' }],
  ['resendVerification', ['unit@example.test'], '/auth/resend-verification', { email: 'unit@example.test' }],
  ['forgotPassword', ['unit@example.test'], '/auth/forgot-password', { email: 'unit@example.test' }],
  ['resetPassword', ['reset', 'NewPass123'], '/auth/reset-password', { token: 'reset', newPassword: 'NewPass123' }],
  ['logout', ['refresh'], '/auth/logout', { refreshToken: 'refresh' }],
]) {
  test(`Authentication API ${method} keeps backend request contract and propagates errors`, async () => {
    const requests = [], response = { data: { message: 'server response' } }
    const client = { post: async (...request) => { requests.push(request); return response } }
    const { authApi } = load('src/features/auth/api/authApi.ts', {}, { '../../../shared/services/apiClient': { default: client } })
    assert.equal(await authApi[method](...args), response)
    assert.equal(requests[0][0], endpoint)
    assert.deepEqual(JSON.parse(JSON.stringify(requests[0][1])), body)
    const failure = new Error('Backend rejected request')
    client.post = async () => { throw failure }
    await assert.rejects(() => authApi[method](...args), error => error === failure)
  })
}

function protectedRoute(user, roles) {
  const { ProtectedRoute } = load('src/shared/components/auth/ProtectedRoute.tsx', {}, {
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    'react-router-dom': { Navigate: 'Navigate', Outlet: 'Outlet', useLocation: () => ({ pathname: '/expert/courses', search: '?page=2' }) },
    '../../context/AuthContext': { useAuth: () => ({ user }) },
  })
  return ProtectedRoute({ roles })
}
test('UC72 after logout direct navigation goes to login and preserves requested URL', () => {
  const view = protectedRoute(null, ['ROLE_EXPERT'])
  assert.equal(view.type, 'Navigate'); assert.equal(view.props.to, '/login')
  assert.equal(view.props.state.from, '/expert/courses?page=2')
})
test('UC01 wrong role is redirected to forbidden', () => {
  assert.equal(protectedRoute({ roles: ['ROLE_STUDENT'] }, ['ROLE_EXPERT']).props.to, '/forbidden')
})
test('UC01 matching role renders protected page outlet', () => {
  assert.equal(protectedRoute({ roles: ['ROLE_EXPERT'] }, ['ROLE_EXPERT']).type, 'Outlet')
})

function findElement(element, type) {
  if (!element || typeof element !== 'object') return undefined
  if (element.type === type) return element
  const children = element.props?.children
  for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
    const found = findElement(child, type)
    if (found) return found
  }
}
function resetPage(token, api) {
  const state = [], jsx = (type, props) => ({ type, props })
  const { ResetPasswordPage } = load('src/features/auth/screens/ResetPasswordPage.tsx', {
    FormData: class { constructor(form) { this.fields = form.fields } get(key) { return this.fields[key] } },
  }, {
    react: { useState: initial => { const index = state.length; state.push(initial); return [initial, value => { state[index] = value }] } },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-router-dom': { Link: 'Link', useSearchParams: () => [new URLSearchParams(token ? `token=${token}` : '')] },
    '../api/authApi': { authApi: api },
  })
  return { tree: ResetPasswordPage(), state }
}
test('UC03 reset confirmation mismatch does not send request', async () => {
  let calls = 0
  const { tree, state } = resetPage('reset-token', { resetPassword: async () => { calls++ } })
  await findElement(tree, 'form').props.onSubmit({ preventDefault() {}, currentTarget: { fields: { password: 'NewPass123', confirmPassword: 'Different123' } } })
  assert.equal(calls, 0); assert.equal(state[1], 'Mật khẩu mới và xác nhận không khớp.')
})
test('UC03 reset form without token cannot be submitted', () => {
  const { tree } = resetPage(null, {})
  assert.equal(findElement(tree, 'form'), undefined)
  assert.equal(findElement(tree, 'p').props.role, 'alert')
})
test('UC03 matching confirmation sends token and password and shows success', async () => {
  const calls = []; let cleared = false
  const { tree, state } = resetPage('reset-token', { resetPassword: async (...args) => { calls.push(args) } })
  await findElement(tree, 'form').props.onSubmit({ preventDefault() {}, currentTarget: {
    fields: { password: 'NewPass123', confirmPassword: 'NewPass123' }, reset() { cleared = true },
  } })
  assert.deepEqual(calls, [['reset-token', 'NewPass123']]); assert.equal(cleared, true)
  assert.equal(state[0], 'Mật khẩu đã được cập nhật. Tất cả phiên đăng nhập cũ đã kết thúc.')
})
test('UC03 reset rejection keeps success empty and reports invalid link', async () => {
  const { tree, state } = resetPage('expired-token', { resetPassword: async () => { throw new Error('HTTP 400') } })
  await findElement(tree, 'form').props.onSubmit({ preventDefault() {}, currentTarget: {
    fields: { password: 'NewPass123', confirmPassword: 'NewPass123' },
  } })
  assert.equal(state[0], ''); assert.match(state[1], /hết hạn/)
})
