import { useQuery } from '@tanstack/react-query'
import { courseService } from '../services/courseService'

export function usePublishedCourses() {
  return useQuery({ queryKey: ['published-courses'], queryFn: courseService.listPublished })
}
