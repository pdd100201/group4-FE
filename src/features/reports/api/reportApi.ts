import apiClient from '../../../shared/services/apiClient'
import type { ReportKind, ReportResponse } from '../../../shared/types/report'
export const reportApi = {
  available: async () => (await apiClient.get<ReportKind[]>('/admin/reports')).data,
  read: async (kind: ReportKind, params: URLSearchParams) =>
    (await apiClient.get<ReportResponse>(`/admin/reports/${kind}`, { params })).data,
  export: async (kind: ReportKind, params: URLSearchParams) => {
    const filters = new URLSearchParams(params)
    filters.delete('page')
    filters.delete('size')
    return (await apiClient.get<Blob>(`/admin/reports/${kind}/export`, {
      params: filters, responseType: 'blob',
    })).data
  },
}
