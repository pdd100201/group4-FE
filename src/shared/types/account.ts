import type { ManagementPage } from './management'
import type { Role } from './auth'

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
export type AccountRoleCode = 'ADMIN' | 'MANAGER' | 'EXPERT' | 'STUDENT'
export interface Account {
  id: number
  email: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  roles: Role[]
  status: AccountStatus
  lockedUntil: string | null
}
export interface AccountRequest {
  email: string
  fullName: string
  phone: string
  roleCode: AccountRoleCode
}
export type AccountPage = ManagementPage<Account>
