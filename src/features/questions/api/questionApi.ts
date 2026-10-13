import apiClient from '../../../shared/services/apiClient'

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
export interface QuestionInput { content: string; type: QuestionType; explanation: string; active: boolean; imageMediaId: number | null; options: { content: string; correct: boolean }[] }
export interface BankQuestion extends QuestionInput { id: number; courseId: number; imageUrl: string | null }
export interface QuestionPage { content: BankQuestion[]; totalElements: number; totalPages: number; number: number }
export interface ImportResult { imported: number; errors: { row: number; message: string }[] }
const base = (courseId: number) => `/expert/courses/${courseId}/questions`
export const questionApi = {
  list: async (courseId: number, params: URLSearchParams) => (await apiClient.get<QuestionPage>(base(courseId), { params })).data,
  create: async (courseId: number, data: QuestionInput) => (await apiClient.post<BankQuestion>(base(courseId), data)).data,
  update: async (courseId: number, id: number, data: QuestionInput) => (await apiClient.put<BankQuestion>(`${base(courseId)}/${id}`, data)).data,
  status: async (courseId: number, id: number, active: boolean) => (await apiClient.patch<BankQuestion>(`${base(courseId)}/${id}/status`, { active })).data,
  remove: async (courseId: number, id: number) => { await apiClient.delete(`${base(courseId)}/${id}`) },
  template: async (courseId: number) => (await apiClient.get<Blob>(`${base(courseId)}/template`, { responseType: 'blob' })).data,
  importFile: async (courseId: number, file: File) => { const form = new FormData(); form.append('file', file); return (await apiClient.post<ImportResult>(`${base(courseId)}/import`, form)).data },
}
