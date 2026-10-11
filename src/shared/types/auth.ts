export type Role = 'ROLE_ADMIN' | 'ROLE_GUEST' | 'ROLE_EXPERT' | 'ROLE_STUDENT' | 'ROLE_MANAGER'
export interface AuthUser { id: number; email: string; fullName: string; roles: Role[]; avatarUrl?: string }
export interface TokenResponse { accessToken: string; refreshToken: string; tokenType: string; userId: number; email: string; fullName: string; roles: Role[] }
export interface ApiMessage { message: string }
export interface RegisterRequest { fullName: string; email: string; phone: string; password: string }
