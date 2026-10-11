import apiClient from '../api/apiClient'
import type { CourseInput, CourseStatus } from './expertCourseService'

export interface LessonPreview { id: number; title: string; content: string | null; position: number | null; active: boolean; videoMediaId: number | null }
export interface QuestionPreview { id: number; content: string; type: string | null; explanation: string | null; points: number | null; options: { id: number; content: string; correct: boolean }[] }
export interface QuizPreview { id: number; title: string; durationMinutes: number | null; passRate: number | null; maxAttempts: number | null; active: boolean; questions: QuestionPreview[] }
export interface ManagerCourse extends CourseInput { id: number; status: CourseStatus; expertName: string; rejectionReason: string | null; reviewedBy: string | null; lessons: LessonPreview[]; quizzes: QuizPreview[]; thumbnailUrl: string | null }
export interface ReviewFilters { search: string; category: string; status: string; page: number }
export interface ReviewPage { content: ManagerCourse[]; totalElements: number; totalPages: number; number: number }
export const managerCourseService = {
  list: async (filters: ReviewFilters) => (await apiClient.get<ReviewPage>('/manager/courses', { params: { ...filters, size: 10 } })).data,
  get: async (id: number) => (await apiClient.get<ManagerCourse>(`/manager/courses/${id}`)).data,
  decide: async ({ id, action, reason }: { id: number; action: 'approve' | 'reject'; reason?: string }) => {
    await apiClient.post(`/manager/courses/${id}/${action}`, action === 'reject' ? { reason } : undefined)
  },
}
