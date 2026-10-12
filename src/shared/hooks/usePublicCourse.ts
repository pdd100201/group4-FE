import { useQuery } from '@tanstack/react-query'
import { courseApi } from '../../features/courses/api/courseApi'

export function usePublicCourse(id: number) {
  return useQuery({ queryKey: ['public-course', id], queryFn: () => courseApi.getPublished(id),
    enabled: Number.isSafeInteger(id) && id > 0, retry: false })
}
