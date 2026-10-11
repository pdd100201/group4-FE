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
