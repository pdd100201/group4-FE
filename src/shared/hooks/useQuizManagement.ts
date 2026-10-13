import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { quizService } from '../../features/quiz/api/quizService'
import type { QuizInput } from '../types/quiz'

export const validId = (value: string | null | undefined) => {
  if (!value || !/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
export function useQuizCourses(role: 'expert' | 'manager', search: string, page: number) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['quiz-courses', user?.id, role, search, page], queryFn: () => quizService.courses(role, search, page) })
}
export function useQuizWorkspace(courseId: number | null) {
  const { user } = useAuth()
  const enabled = courseId !== null
  const course = useQuery({ queryKey: ['quiz-course', user?.id, courseId], queryFn: () => quizService.course(courseId!), enabled })
  const quizzes = useQuery({ queryKey: ['managed-quizzes', user?.id, courseId], queryFn: () => quizService.list(courseId!), enabled: enabled && course.isSuccess })
  const lessons = useQuery({ queryKey: ['quiz-lessons', user?.id, courseId], queryFn: () => quizService.lessons(courseId!), enabled: enabled && course.isSuccess })
  return { course, quizzes, lessons }
}
export function useQuizDetail(courseId: number | null, quizId: number | null) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['managed-quiz', user?.id, courseId, quizId], queryFn: () => quizService.get(courseId!, quizId!), enabled: courseId !== null && quizId !== null })
}
export function useQuizWrites(courseId: number) {
  const client = useQueryClient()
  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['managed-quizzes'] }),
      client.invalidateQueries({ queryKey: ['managed-quiz'] }),
      client.invalidateQueries({ queryKey: ['quiz-course'] }),
      client.invalidateQueries({ queryKey: ['quiz-review'] }),
      client.invalidateQueries({ queryKey: ['expert-quiz-list'] }),
    ])
  }
  const save = useMutation({ mutationFn: ({ id, input }: { id: number | null; input: QuizInput }) =>
    id === null ? quizService.create(courseId, input) : quizService.update(courseId, id, input), onSuccess: invalidate, onError: invalidate })
  const remove = useMutation({ mutationFn: (id: number) => quizService.remove(courseId, id), onSuccess: invalidate, onError: invalidate })
  return { save, remove }
}
export function useQuizReview(courseId: number | null) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['quiz-review', user?.id, courseId], queryFn: () => quizService.review(courseId!), enabled: courseId !== null })
}
