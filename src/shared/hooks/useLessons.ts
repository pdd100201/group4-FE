import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { lessonApi } from '../../features/expert/api/lessonApi'
export function useLessons(courseId: number) { return useQuery({ queryKey: ['lessons', courseId], queryFn: () => lessonApi.list(courseId) }) }
export function useLessonActions(courseId: number) {
  const client = useQueryClient()
  const refresh = async () => { await Promise.all(['expert-course', 'expert-courses', 'published-courses', 'public-course', 'manager-course-changes', 'lesson-question-selection'].map(key => client.invalidateQueries({ queryKey: [key] })).concat([client.invalidateQueries({ queryKey: ['course-curriculum'] }), client.invalidateQueries({ queryKey: ['quiz-lessons'] }), client.invalidateQueries({ queryKey: ['lessons', courseId] }), client.invalidateQueries({ queryKey: ['manager-course', courseId] }), client.invalidateQueries({ queryKey: ['course-submission-readiness', courseId] })])) }
  return { save: useMutation({ mutationFn: lessonApi.save, onSuccess: refresh }), remove: useMutation({ mutationFn: lessonApi.remove, onSuccess: refresh }) }
}
