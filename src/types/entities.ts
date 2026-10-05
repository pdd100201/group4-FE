export interface RoleEntity { id: number; name: string }
export interface User { id: number; email: string; fullName: string; roles: RoleEntity[] }
export interface PasswordResetToken { id: number; token: string; expiresAt: string }
export interface Course { id: number; title: string; description: string; status: CourseStatus; price: number }
export type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'ARCHIVED'
export interface Lesson { id: number; title: string; content: string; active: boolean }
export interface CourseRegistration { id: number; status: string; amount: number }
export interface Payment { id: number; amount: number; status: string }
export interface Transaction { id: number; amount: number; type: string }
export interface StudentLessonProgress { id: number; completed: boolean; progressPercent: number }
export interface Quiz { id: number; title: string; durationMinutes: number; passRate: number }
export interface Question { id: number; content: string; type: string; options: QuestionOption[] }
export interface QuestionOption { id: number; content: string; correct: boolean }
export interface QuizQuestion { id: number; position: number; points: number }
export interface QuizAttempt { id: number; score?: number; passed: boolean }
export interface QuizAnswer { id: number; textAnswer?: string; correct: boolean }
export interface QuizAnswerOption { id: number }
export interface Post { id: number; title: string; content: string; published: boolean }
export interface PostComment { id: number; content: string; status: string }
export interface AuditLog { id: number; action: string; targetType: string; createdAt: string }
