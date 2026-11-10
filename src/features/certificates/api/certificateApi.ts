import apiClient from '../../../shared/services/apiClient'
export type Page<T> = { content: T[]; totalElements: number; totalPages: number }
export type Certificate = { id: number; courseId: number; code: string; status: 'ISSUED' | 'REVOKED'; studentName: string; courseTitle: string; expertName: string; issuerName: string; policyVersion: number; issuedAt: string; revokedAt: string | null; revocationReason: string | null }
export type PublicCertificate = Pick<Certificate, 'code' | 'status' | 'studentName' | 'courseTitle' | 'issuerName' | 'issuedAt' | 'revokedAt'>
export type Requirement = { id: number; title: string; complete: boolean }
export type Eligibility = { courseId: number; courseTitle: string; enabled: boolean; eligible: boolean; reasons: string[]; lessons: Requirement[]; quizzes: Requirement[]; certificate: Certificate | null }
export type Policy = { id: number; version: number; enabled: boolean; issuerName: string; configuredBy: string; createdAt: string; lessons: Requirement[]; quizzes: Requirement[] }
export type PolicyOptions = { courseId: number; courseTitle: string; courseStatus: string; lessons: Requirement[]; quizzes: Requirement[]; current: Policy | null; history: Policy[] }
export type CourseOption = { id: number; title: string; status: string; expertName: string }
export type Audit = { id: number; action: string; actorName: string; reason: string | null; occurredAt: string }
export const managementBase = (admin: boolean) => admin ? '/admin/certificates' : '/manager/certificates'
export const certificateApi = {
 mine: async (search: string, status: string, page: number) => (await apiClient.get<Page<Certificate>>('/student/certificates', { params: { search, status, page } })).data,
 detail: async (id: number) => (await apiClient.get<Certificate>(`/student/certificates/${id}`)).data,
 courses: async (search: string, page: number) => (await apiClient.get<Page<Eligibility>>('/student/certificates/courses', { params: { search, page } })).data,
 check: async (id: number) => (await apiClient.post<Eligibility>(`/student/certificates/courses/${id}/check`)).data,
 verify: async (code: string) => (await apiClient.get<PublicCertificate>(`/public/certificates/${encodeURIComponent(code)}`)).data,
 list: async (base: string, search: string, status: string, courseId: number | undefined, page: number) => (await apiClient.get<Page<Certificate>>(base, { params: { search, status, courseId, page } })).data,
 options: async (base: string, search: string, page: number, eligibleOnly: boolean) => (await apiClient.get<Page<CourseOption>>(base + '/courses', { params: { search, page, eligibleOnly } })).data,
 policy: async (base: string, courseId: number) => (await apiClient.get<PolicyOptions>(`${base}/courses/${courseId}/policy`)).data,
 savePolicy: async (base: string, courseId: number, body: { enabled: boolean; issuerName: string; quizIds: number[]; expectedVersion: number }) => (await apiClient.post<Policy>(`${base}/courses/${courseId}/policy`, body)).data,
 managedDetail: async (base: string, id: number) => (await apiClient.get<Certificate>(`${base}/${id}`)).data,
 audit: async (base: string, id: number, page: number) => (await apiClient.get<Page<Audit>>(`${base}/${id}/audit`, { params: { page } })).data,
 revoke: async (base: string, id: number, reason: string) => (await apiClient.post<Certificate>(`${base}/${id}/revoke`, { reason })).data,
 download: async (id: number, code: string, base = '/student/certificates') => {
  const blob = (await apiClient.get<Blob>(`${base}/${id}/pdf`, { responseType: 'blob' })).data
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a'); link.href = url; link.download = `certificate-${code}.pdf`; link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
 },
}
