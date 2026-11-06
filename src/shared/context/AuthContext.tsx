import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { authApi } from '../../features/auth/api/authApi'
import { profileApi } from '../../features/profile/api/profileApi'
import { authStorage } from '../utils/authStorage'
import type { AuthUser } from '../types/auth'

type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, password: string, remember: boolean) => Promise<AuthUser>
  loginWithGoogle: (credential: string, remember: boolean) => Promise<AuthUser>
  updateCurrentUser: (changes: Partial<AuthUser>) => void
  refreshCurrentUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => authStorage.user())

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const response = await authApi.login(email, password)
    const next = authStorage.save(response.data, remember)
    setUser(next)
    return next
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = authStorage.refreshToken()
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } finally {
      authStorage.clear()
      setUser(null)
    }
  }, [])

  const loginWithGoogle = useCallback(async (credential: string, remember: boolean) => {
    const response = await authApi.googleLogin(credential)
    const next = authStorage.save(response.data, remember)
    setUser(next)
    return next
  }, [])

  const updateCurrentUser = useCallback((changes: Partial<AuthUser>) => {
    const updated = authStorage.updateUser(changes)
    if (updated) setUser(updated)
  }, [])

  const refreshCurrentUser = useCallback(async () => {
    const current = authStorage.user()
    if (!current) return
    const profile = await profileApi.current()
    if (authStorage.user()?.id !== current.id || profile.id !== current.id) return
    const updated = authStorage.updateUser({ fullName: profile.fullName, email: profile.email,
      avatarUrl: profile.avatarUrl ?? undefined, roles: profile.roles })
    if (updated) setUser(previous => JSON.stringify(previous) === JSON.stringify(updated) ? previous : updated)
  }, [])
  useEffect(() => {
    if (!user?.id) return
    const refresh = () => { if (document.visibilityState === 'visible') void refreshCurrentUser().catch(() => {}) }
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    const interval = window.setInterval(refresh, 60000)
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); window.clearInterval(interval) }
  }, [user?.id, refreshCurrentUser])

  const value = useMemo(() => ({ user, login, loginWithGoogle, updateCurrentUser, refreshCurrentUser, logout }), [user, login, loginWithGoogle, updateCurrentUser, refreshCurrentUser, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
