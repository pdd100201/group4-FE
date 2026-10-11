import { useQuery } from '@tanstack/react-query'
import { courseService } from '../services/courseService'

export function usePublicCourse(id: number) {
  return useQuery({ queryKey: ['public-course', id], queryFn: () => courseService.getPublished(id),
    enabled: Number.isSafeInteger(id) && id > 0, retry: false })
}
