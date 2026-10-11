import apiClient from '../api/apiClient'
export type CourseStatus = 'DRAFT' | 'REJECTED' | 'PENDING_REVIEW' | 'PUBLISHED' | 'APPROVED' | 'ARCHIVED'
export interface CourseInput { title: string; description: string; category: string; price: number; thumbnailMediaId?: number | null }
export interface ExpertCourse extends CourseInput { id: number; status: CourseStatus; rejectionReason: string | null; editable: boolean; deletable: boolean; thumbnailUrl: string | null }
export interface CourseFilters { search: string; category: string; status: string; page: number }
export interface CoursePage { content: ExpertCourse[]; totalElements: number; totalPages: number; number: number }
export interface SubmissionReadiness { eligible: boolean; ready: boolean; checks: { code: string; label: string; complete: boolean }[] }
export const courseStatusLabels: Record<CourseStatus, string> = { DRAFT: 'Nháp', REJECTED: 'Bị từ chối', PENDING_REVIEW: 'Chờ duyệt', PUBLISHED: 'Đã xuất bản', APPROVED: 'Đã duyệt (dữ liệu cũ)', ARCHIVED: 'Đã lưu trữ' }
export const expertCourseService = {
  readiness: async (id: number) => (await apiClient.get<SubmissionReadiness>(`/expert/courses/${id}/submission-readiness`)).data,
  list: async (filters: CourseFilters) => (await apiClient.get<CoursePage>('/expert/courses', { params: { ...filters, status: filters.status || undefined, size: 10 } })).data,
  get: async (id: number) => (await apiClient.get<ExpertCourse>(`/expert/courses/${id}`)).data,
  create: async (input: CourseInput) => (await apiClient.post<ExpertCourse>('/expert/courses', input)).data,
  update: async (id: number, input: CourseInput) => (await apiClient.put<ExpertCourse>(`/expert/courses/${id}`, input)).data,
  remove: async (id: number) => { await apiClient.delete(`/expert/courses/${id}`) },
  submit: async (course: ExpertCourse) => { await apiClient.post(`/expert/courses/${course.id}/${course.status === 'REJECTED' ? 'resubmit' : 'submit'}`) },
}
