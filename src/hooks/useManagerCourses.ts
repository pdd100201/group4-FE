import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerCourseService, type ReviewFilters } from '../services/managerCourseService'
export function useManagerCourses(filters: ReviewFilters) { return useQuery({ queryKey: ['manager-courses', filters], queryFn: () => managerCourseService.list(filters) }) }
export function useManagerCourse(id: number) { return useQuery({ queryKey: ['manager-course', id], queryFn: () => managerCourseService.get(id), enabled: Number.isSafeInteger(id) && id > 0 }) }
export function useCourseDecision() {
  const client = useQueryClient()
  return useMutation({ mutationFn: managerCourseService.decide, onSuccess: async () => {
    await Promise.all(['manager-courses', 'manager-course', 'expert-courses', 'expert-course', 'published-courses', 'public-course'].map(key => client.invalidateQueries({ queryKey: [key] })))
  } })
}
