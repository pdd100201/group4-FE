import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { lessonService } from '../services/lessonService'
export function useLessons(courseId: number) { return useQuery({ queryKey: ['lessons', courseId], queryFn: () => lessonService.list(courseId) }) }
export function useLessonActions(courseId: number) {
  const client = useQueryClient()
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: ['lessons', courseId] }), client.invalidateQueries({ queryKey: ['manager-course', courseId] }), client.invalidateQueries({ queryKey: ['course-submission-readiness', courseId] })]) }
  return { save: useMutation({ mutationFn: lessonService.save, onSuccess: refresh }), remove: useMutation({ mutationFn: lessonService.remove, onSuccess: refresh }) }
}
