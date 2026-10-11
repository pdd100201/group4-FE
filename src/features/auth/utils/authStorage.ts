import type { AuthUser, TokenResponse } from '../types/auth'

const keys = ['ols.accessToken', 'ols.refreshToken', 'ols.user'] as const

function value(key: typeof keys[number]) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

export const authStorage = {
  accessToken: () => value('ols.accessToken'),
  refreshToken: () => value('ols.refreshToken'),
  user: (): AuthUser | null => {
    const raw = value('ols.user')
    if (!raw || !authStorage.accessToken()) return null
    try { return JSON.parse(raw) as AuthUser } catch { authStorage.clear(); return null }
  },
  save(data: TokenResponse, remember: boolean) {
    authStorage.clear()
    const storage = remember ? localStorage : sessionStorage
    const user: AuthUser = { id: data.userId, email: data.email, fullName: data.fullName, roles: data.roles }
    storage.setItem('ols.accessToken', data.accessToken)
    storage.setItem('ols.refreshToken', data.refreshToken)
    storage.setItem('ols.user', JSON.stringify(user))
    return user
  },
  updateTokens(data: Pick<TokenResponse, 'accessToken' | 'refreshToken'>) {
    const storage = localStorage.getItem('ols.refreshToken') ? localStorage : sessionStorage
    storage.setItem('ols.accessToken', data.accessToken)
    storage.setItem('ols.refreshToken', data.refreshToken)
  },
  updateUser(changes: Partial<AuthUser>) {
    const storage = localStorage.getItem('ols.user') ? localStorage : sessionStorage
    const current = authStorage.user()
    if (!current) return null
    const updated = { ...current, ...changes }
    storage.setItem('ols.user', JSON.stringify(updated))
    return updated
  },
  clear() {
    keys.forEach((key) => { localStorage.removeItem(key); sessionStorage.removeItem(key) })
  },
}
