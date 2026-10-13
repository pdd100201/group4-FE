import apiClient from '../../../shared/services/apiClient'
export interface QuizInfo { id: number; courseId: number; lessonId: number | null; courseTitle: string; title: string; durationMinutes: number; passRate: number; maxAttempts: number; attemptsUsed: number; history: { id: number; submittedAt: string | null; score: number | null; passed: boolean }[] }
export interface QuizQuestion { id: number; position: number; content: string; type: string; imageUrl: string | null; points: number; options: { id: number; content: string }[]; selectedIds: number[] }
export interface QuizAttempt { id: number; quizId: number; courseId: number; lessonId: number | null; title: string; serverTime: string; deadline: string; submittedAt: string | null; questions: QuizQuestion[] }
export interface QuizAnswer { questionId: number; optionIds: number[] }
export interface QuizReview extends QuizQuestion { awardedPoints: number; correct: boolean; explanation: string | null; correctIds: number[] }
export interface QuizResult { id: number; quizId: number; courseId: number; lessonId: number | null; title: string; score: number; passed: boolean; passRate: number; correctQuestions: number; totalQuestions: number; secondsUsed: number; questions: QuizReview[] }
export const studentQuizApi = {
  info: async (id: number) => (await apiClient.get<QuizInfo>(`/student/quizzes/${id}`)).data,
  start: async (id: number) => (await apiClient.post<QuizAttempt>(`/student/quizzes/${id}/attempts`)).data,
  attempt: async (id: number) => (await apiClient.get<QuizAttempt>(`/student/quiz-attempts/${id}`)).data,
  answer: async (id: number, answer: QuizAnswer) => (await apiClient.put<QuizAttempt>(`/student/quiz-attempts/${id}/answers`, answer)).data,
  submit: async (id: number, answers: QuizAnswer[]) => (await apiClient.post<QuizResult>(`/student/quiz-attempts/${id}/submit`, { answers })).data,
  result: async (id: number) => (await apiClient.get<QuizResult>(`/student/quiz-attempts/${id}/result`)).data,
}
