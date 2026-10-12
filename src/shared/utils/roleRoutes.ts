import type { AuthUser, Role } from '../types/auth'

const destinations: Array<[Role, string]> = [
  ['ROLE_ADMIN', '/dashboard'],
  ['ROLE_MANAGER', '/manager/courses/review'],
  ['ROLE_EXPERT', '/expert/courses'],
  ['ROLE_STUDENT', '/'],
]

export function landingRoute(user: AuthUser) {
  return destinations.find(([role]) => user.roles.includes(role))?.[1] ?? '/forbidden'
}

// Registration intent is navigation only, never identity or financial authority.
export function registrationReturnRoute(user: AuthUser, requested: unknown) {
  if (!user.roles.includes('ROLE_STUDENT') || typeof requested !== 'string') return null
  return /^\/student\/courses\/[1-9]\d*\/register\?packageId=[1-9]\d*$/.test(requested) ? requested : null
}
