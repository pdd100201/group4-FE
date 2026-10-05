import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'
import { authService } from '../services/authService'
import type { AuthUser, TokenResponse } from '../types/auth'
type AuthContextValue = { user: AuthUser | null; login: (email: string,password: string) => Promise<AuthUser>; logout: () => void }
const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const readUser = (): AuthUser | null => { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) as AuthUser : null }
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(readUser)
  const saveSession = (data: TokenResponse): AuthUser => { const next = { id: data.userId, email: data.email, roles: data.roles }; localStorage.setItem('accessToken', data.accessToken); localStorage.setItem('refreshToken', data.refreshToken); localStorage.setItem('user', JSON.stringify(next)); setUser(next); return next }
  const value = useMemo(() => ({ user, login: async (email: string,password: string) => saveSession((await authService.login(email,password)).data), logout: () => { localStorage.clear(); setUser(null) } }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context }
