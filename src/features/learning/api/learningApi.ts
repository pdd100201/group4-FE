import apiClient from '../../../shared/services/apiClient'

export interface LearningCourse {
  courseId: number; courseTitle: string; expertName: string; completedLessons: number; progressPercent: number
  lessons: { id: number; title: string; position: number | null; completed: boolean }[]
  currentLesson: { id: number; title: string; content: string | null; videoMediaId: number | null } | null
  quizzes: { id: number | null; lessonId: number | null; title: string; durationMinutes: number; passRate: number; questionCount: number; passed: boolean }[]
}
export const learningApi = {
  prepareQuestions: async (courseId: number, lessonId: number) => (await apiClient.post<{ quizId: number }>(`/student/courses/${courseId}/lessons/${lessonId}/questions`)).data,
  read: async (courseId: number, lessonId: number | null) => (await apiClient.get<LearningCourse>(`/student/courses/${courseId}/${lessonId === null ? 'learning' : `lessons/${lessonId}`}`)).data,
  complete: async (courseId: number, lessonId: number) => (await apiClient.post<LearningCourse>(`/student/courses/${courseId}/lessons/${lessonId}/complete`)).data,
}
