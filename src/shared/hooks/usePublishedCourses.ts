import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { courseApi } from '../../features/courses/api/courseApi'

export function usePublishedCourses(filters: { search?: string; category?: string } = {}) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['published-courses', user?.id, filters], queryFn: () => courseApi.listPublished(filters) })
}
