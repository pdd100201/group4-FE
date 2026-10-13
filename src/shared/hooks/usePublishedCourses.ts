import { useQuery } from '@tanstack/react-query'
import { courseApi } from '../../features/courses/api/courseApi'

export function usePublishedCourses(filters: { search?: string; category?: string } = {}) {
  return useQuery({ queryKey: ['published-courses', filters], queryFn: () => courseApi.listPublished(filters) })
}
