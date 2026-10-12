import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerCourseApi, type ReviewFilters } from '../../features/management/api/managerCourseApi'
export function useManagerCourses(filters: ReviewFilters) { return useQuery({ queryKey: ['manager-courses', filters], queryFn: () => managerCourseApi.list(filters) }) }
export function useManagerCourse(id: number) { return useQuery({ queryKey: ['manager-course', id], queryFn: () => managerCourseApi.get(id), enabled: Number.isSafeInteger(id) && id > 0 }) }
export function useCourseDecision() {
  const client = useQueryClient()
  return useMutation({ mutationFn: managerCourseApi.decide, onSuccess: async () => {
    await Promise.all(['manager-courses', 'manager-course', 'expert-courses', 'expert-course', 'published-courses', 'public-course'].map(key => client.invalidateQueries({ queryKey: [key] })))
  } })
}
