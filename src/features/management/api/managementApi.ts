import apiClient from '../../../shared/services/apiClient'
import type { ManagementKind, ManagementPage, ManagementRecord, ManagementScope } from '../../../shared/types/management'

export const managementApi = {
  list: async (scope: ManagementScope, kind: ManagementKind, params: URLSearchParams) => {
    const { data } = await apiClient.get<ManagementPage<ManagementRecord>>(`/${scope}/${kind}`, { params })
    return data
  },
  detail: async (scope: ManagementScope, kind: ManagementKind, id: string) => {
    const { data } = await apiClient.get<ManagementRecord>(`/${scope}/${kind}/${id}`)
    return data
  },
}
