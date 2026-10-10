import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react'
import { authService } from '../services/authService'
import { authStorage } from '../utils/authStorage'
import type { AuthUser } from '../types/auth'

type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, password: string, remember: boolean) => Promise<AuthUser>
  loginWithGoogle: (credential: string, remember: boolean) => Promise<AuthUser>
  updateCurrentUser: (changes: Partial<AuthUser>) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => authStorage.user())

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const response = await authService.login(email, password)
    const next = authStorage.save(response.data, remember)
    setUser(next)
    return next
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = authStorage.refreshToken()
    try {
      if (refreshToken) await authService.logout(refreshToken)
    } finally {
      authStorage.clear()
      setUser(null)
    }
  }, [])

  const loginWithGoogle = useCallback(async (credential: string, remember: boolean) => {
    const response = await authService.googleLogin(credential)
    const next = authStorage.save(response.data, remember)
    setUser(next)
    return next
  }, [])

  const updateCurrentUser = useCallback((changes: Partial<AuthUser>) => {
    const updated = authStorage.updateUser(changes)
    if (updated) setUser(updated)
  }, [])

  const value = useMemo(() => ({ user, login, loginWithGoogle, updateCurrentUser, logout }), [user, login, loginWithGoogle, updateCurrentUser, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
