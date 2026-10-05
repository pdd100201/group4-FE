export type Role = 'ROLE_ADMIN' | 'ROLE_GUEST' | 'ROLE_EXPERT' | 'ROLE_STUDENT' | 'ROLE_MANAGER'
export interface AuthUser { id: number; email: string; roles: Role[] }
export interface TokenResponse { accessToken: string; refreshToken: string; tokenType: string; userId: number; email: string; roles: Role[] }
