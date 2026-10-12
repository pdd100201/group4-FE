import axios from 'axios'
import apiClient from '../api/apiClient'
import type { CoursePage, ManagedQuiz, QuizCourse, QuizInput, QuizLesson, ReviewCourse } from '../types/quiz'

const base = (courseId: number) => `/expert/courses/${courseId}/quizzes`
export const quizService = {
  courses: async (role: 'expert' | 'manager', search: string, page: number): Promise<CoursePage> =>
    (await apiClient.get<CoursePage>(`/${role}/courses`, { params: { search, page, size: 10, ...(role === 'manager' ? { status: 'PENDING_REVIEW' } : {}) } })).data,
  course: async (id: number): Promise<QuizCourse> => (await apiClient.get<QuizCourse>(`/expert/courses/${id}`)).data,
  lessons: async (id: number): Promise<QuizLesson[]> => (await apiClient.get<QuizLesson[]>(`/expert/courses/${id}/lessons`)).data,
  list: async (id: number): Promise<ManagedQuiz[]> => (await apiClient.get<ManagedQuiz[]>(base(id))).data,
  get: async (courseId: number, id: number): Promise<ManagedQuiz> => (await apiClient.get<ManagedQuiz>(`${base(courseId)}/${id}`)).data,
  create: async (courseId: number, input: QuizInput): Promise<ManagedQuiz> => (await apiClient.post<ManagedQuiz>(base(courseId), input)).data,
  update: async (courseId: number, id: number, input: QuizInput): Promise<ManagedQuiz> => (await apiClient.put<ManagedQuiz>(`${base(courseId)}/${id}`, input)).data,
  remove: async (courseId: number, id: number): Promise<void> => { await apiClient.delete(`${base(courseId)}/${id}`) },
  review: async (id: number): Promise<ReviewCourse> => (await apiClient.get<ReviewCourse>(`/manager/courses/${id}`)).data,
}

export function quizError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string' && message) return message
    if (error.response?.status === 403) return 'Bạn không có quyền truy cập quiz hoặc khóa học này.'
    if (error.response?.status === 404) return 'Quiz hoặc khóa học không còn tồn tại.'
    if (error.response?.status === 409) return 'Không thể thay đổi quiz do trạng thái khóa học hoặc dữ liệu học tập cần lưu giữ.'
    if (!error.response) return 'Không kết nối được máy chủ. Vui lòng thử lại.'
  }
  return 'Không thể hoàn tất thao tác. Vui lòng thử lại.'
}
