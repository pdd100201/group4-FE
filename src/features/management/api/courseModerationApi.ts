import apiClient from '../../../shared/services/apiClient'
import type { ReviewPage } from './managerCourseApi'
export type Moderator = 'admin' | 'manager'
export type ModerationAction = 'archive' | 'restore' | 'delete'
export const courseModerationApi = {
  list: async (role: Moderator, status: 'PUBLISHED' | 'ARCHIVED', page: number) =>
    (await apiClient.get<ReviewPage>(role === 'admin'
      ? status === 'ARCHIVED' ? '/admin/courses/archived' : '/admin/courses'
      : '/manager/courses', { params: { page, size: 10, status } })).data,
  act: async ({ role, id, action, reason }: { role: Moderator; id: number; action: ModerationAction; reason: string }) => {
    if (action === 'delete') await apiClient.delete(`/${role}/courses/${id}`, { data: { reason } })
    else await apiClient.post(`/${role}/courses/${id}/${action}`, { reason })
  },
}
