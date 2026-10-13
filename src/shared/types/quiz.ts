export type CourseStatus = 'DRAFT' | 'REJECTED' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'APPROVED'

export interface QuizQuestionItem { questionId: number; position: number; points: number }
export interface QuizQuestionResponse extends QuizQuestionItem { content: string }
export interface ManagedQuiz {
  id: number; courseId: number; lessonId: number | null; title: string
  durationMinutes: number | null; passRate: number | null; maxAttempts: number | null
  active: boolean; questions: QuizQuestionResponse[]
}
export interface QuizInput {
  title: string; durationMinutes: number; passRate: number; maxAttempts: number
  active: boolean; lessonId: number | null; questions: QuizQuestionItem[]
}
export interface QuizCourse { id: number; title: string; status: CourseStatus; category: string }
export interface CoursePage { content: QuizCourse[]; totalElements: number; totalPages: number; number: number }
export interface QuizLesson { id: number; title: string; position: number; active: boolean }
export interface PreviewQuestion {
  id: number; content: string; type: string | null; explanation: string | null; points: number | null
  options: { id: number; content: string; correct: boolean }[]
}
export interface PreviewQuiz {
  id: number; title: string; durationMinutes: number | null; passRate: number | null
  maxAttempts: number | null; active: boolean; questions: PreviewQuestion[]
}
export interface ReviewCourse extends QuizCourse { expertName: string; quizzes: PreviewQuiz[] }
export interface QuizListItem {
  id: number; courseId: number; courseTitle: string; category: string; courseStatus: CourseStatus
  title: string; questionCount: number; durationMinutes: number | null; passRate: number | null
  maxAttempts: number | null; active: boolean; retained: boolean
}
export interface QuizPage { content: QuizListItem[]; totalElements: number; totalPages: number; number: number }
export interface QuestionChoice { id: number; content: string; type: string | null; active: boolean }
export interface QuestionPage { content: QuestionChoice[]; totalElements: number; totalPages: number; number: number }
