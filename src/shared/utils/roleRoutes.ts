import type { AuthUser, Role } from '../types/auth'

const destinations: Array<[Role, string]> = [
  ['ROLE_ADMIN', '/dashboard'],
  ['ROLE_MANAGER', '/manager/courses/review'],
  ['ROLE_EXPERT', '/expert/courses'],
  ['ROLE_STUDENT', '/student/courses'],
]

export function landingRoute(user: AuthUser) {
  return destinations.find(([role]) => user.roles.includes(role))?.[1] ?? '/forbidden'
}

export function postLoginRoute(user: AuthUser, requested?: string) {
  if (!requested?.startsWith('/') || requested.startsWith('//') || requested.includes('\\')) {
    return landingRoute(user)
  }
  const pathname = new URL(requested, 'http://localhost').pathname
  const boundaries: Array<[string, Role]> = [
    ['/admin', 'ROLE_ADMIN'],
    ['/manager', 'ROLE_MANAGER'],
    ['/expert', 'ROLE_EXPERT'],
    ['/student', 'ROLE_STUDENT'],
    ['/dashboard', 'ROLE_ADMIN'],
  ]
  const required = boundaries.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1]
  if (required && !user.roles.includes(required)) return landingRoute(user)
  if (['/forbidden', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(pathname)) {
    return landingRoute(user)
  }
  return requested
}
