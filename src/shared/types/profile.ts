import type { Role } from './auth'

export interface Profile {
  id: number
  email: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  roles: Role[]
}
export interface ProfileUpdate { fullName: string; phone: string; avatarUrl: string }
export interface PasswordChange { currentPassword: string; newPassword: string; confirmation: string }
