import apiClient from '../../../shared/services/apiClient'
import type { Account, AccountPage, AccountRequest, AccountStatus } from '../../../shared/types/account'

export const accountApi = {
  list: async (params: URLSearchParams) => (await apiClient.get<AccountPage>('/admin/accounts', { params })).data,
  detail: async (id: number) => (await apiClient.get<Account>(`/admin/accounts/${id}`)).data,
  create: async (request: AccountRequest) => (await apiClient.post<Account>('/admin/accounts', request)).data,
  update: async (id: number, request: AccountRequest) => (await apiClient.put<Account>(`/admin/accounts/${id}`, request)).data,
  updateStatus: async (id: number, status: AccountStatus) =>
    (await apiClient.patch<Account>(`/admin/accounts/${id}/status`, { status })).data,
}
