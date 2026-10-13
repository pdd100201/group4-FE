import apiClient from '../../../shared/services/apiClient'
import type { DashboardData } from '../../../shared/types/dashboard'
export const dashboardApi = { read: async () => (await apiClient.get<DashboardData>('/admin/dashboard')).data }
