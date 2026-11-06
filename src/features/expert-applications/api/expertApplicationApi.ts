import apiClient from '../../../shared/services/apiClient'

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ApplicationInput = { specialty: string; experienceYears: number; experience: string; introduction: string; portfolioUrl: string }
export type ApplicationDocument = { id: number; name: string; contentType: string; sizeBytes: number }
export type ExpertApplication = ApplicationInput & {
  id: number; applicantId: number; applicantName: string; applicantEmail: string; applicantPhone: string | null
  status: ApplicationStatus; submittedAt: string; reviewedAt: string | null; reviewerName: string | null
  reviewReason: string | null; documents: ApplicationDocument[]
}
export const applicationStatusLabels: Record<ApplicationStatus, string> = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối' }
export const expertApplicationApi = {
  mine: async (): Promise<ExpertApplication | null> => (await apiClient.get<ExpertApplication>('/expert-applications/mine')).data || null,
  submit: async (details: ApplicationInput, files: File[]) => {
    const form = new FormData()
    form.append('details', new Blob([JSON.stringify(details)], { type: 'application/json' }))
    files.forEach(file => form.append('files', file))
    return (await apiClient.post<ExpertApplication>('/expert-applications', form)).data
  },
  list: async (status: string, search: string, page: number) => (await apiClient.get<{ content: ExpertApplication[]; totalElements: number; totalPages: number }>(
    '/admin/expert-applications', { params: { status, search, page } })).data,
  detail: async (id: number) => (await apiClient.get<ExpertApplication>(`/admin/expert-applications/${id}`)).data,
  review: async (id: number, approve: boolean, reason: string) => (await apiClient.put<ExpertApplication>(`/admin/expert-applications/${id}/review`, { approve, reason })).data,
  download: async (document: ApplicationDocument) => {
    const { data } = await apiClient.get<Blob>(`/expert-applications/documents/${document.id}`, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const link = window.document.createElement('a'); link.href = url; link.download = document.name; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
}
