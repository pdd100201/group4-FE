import { useQuery } from '@tanstack/react-query'
import { courseApi } from '../api/courseApi'

export function usePublishedCourses() {
  return useQuery({ queryKey: ['published-courses'], queryFn: courseApi.listPublished })
}
