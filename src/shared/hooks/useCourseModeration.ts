import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { courseModerationApi, type Moderator } from '../../features/management/api/courseModerationApi'
export function useModerationCourses(role: Moderator, status: 'PUBLISHED' | 'ARCHIVED', page: number) {
  return useQuery({ queryKey: ['moderation-courses', role, status, page], queryFn: () => courseModerationApi.list(role, status, page) })
}
export function useCourseModeration() {
  const client = useQueryClient()
  return useMutation({ mutationFn: courseModerationApi.act, onSuccess: async () => {
    await Promise.all(['moderation-courses', 'archived-courses', 'manager-courses', 'manager-course', 'expert-courses', 'expert-course', 'published-courses', 'public-course']
      .map(key => client.invalidateQueries({ queryKey: [key] })))
  } })
}
