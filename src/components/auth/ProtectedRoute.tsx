import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types/auth'
export function ProtectedRoute({ roles }: { roles?: Role[] }) { const { user } = useAuth(); if (!user) return <Navigate to="/login" replace />; if (roles && !roles.some(role => user.roles.includes(role))) return <Navigate to="/forbidden" replace />; return <Outlet /> }
