import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types/auth'
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  if (roles && !roles.some(role => user.roles.includes(role))) return <Navigate to="/forbidden" replace />
  return <Outlet />
}
