import apiClient from '../../../shared/services/apiClient'
import type { CourseStatus } from './expertCourseApi'
import type { StudentRegistration } from '../../registrations/api/registrationApi'

export type RegistrationStatus = 'ACTIVE' | 'EXPIRED'
export interface ExpertStudentRow {
  registrationId: number; studentId: number; studentName: string; studentEmail: string
  packageName: string | null; amount: number | null; status: RegistrationStatus; paymentStatus: string | null
  createdAt: string | null; validFrom: string | null; validUntil: string | null; lifetime: boolean
  accessStatus: 'CURRENT' | 'EXPIRED' | 'UPCOMING' | 'NOT_ACTIVATED'
}
export interface ExpertStudentsResult {
  courseId: number; courseTitle: string; courseStatus: CourseStatus
  summary: { students: number; registrations: number; currentStudents: number; expiredRegistrations: number }
  items: ExpertStudentRow[]; page: number; size: number; totalElements: number; totalPages: number
}
export interface ExpertRegistrationDetail {
  registration: StudentRegistration; studentId: number; paymentStatus: string | null; provider: string | null
  accessStatus: ExpertStudentRow['accessStatus']
}
export const expertStudentsApi = {
  detail: async (courseId: number, registrationId: number) =>
    (await apiClient.get<ExpertRegistrationDetail>(`/expert/courses/${courseId}/registrations/${registrationId}`)).data,
  list: async (id: number, params: { q: string; status: string; page: number }) =>
    (await apiClient.get<ExpertStudentsResult>(`/expert/courses/${id}/registrations`, { params: { ...params, status: params.status || undefined, size: 20 } })).data,
}
