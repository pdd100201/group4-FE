import apiClient from '../../../shared/services/apiClient'
export type NotificationItem = { id: number; type: string; category: string; title: string; message: string; link: string; createdAt: string; readAt: string | null }
export type NotificationPage = { content: NotificationItem[]; totalElements: number; totalPages: number }
export const notificationApi = {
 summary: async () => (await apiClient.get<{ unreadCount: number; latestId: number | null }>('/notifications/summary')).data,
 list: async (page = 0, unreadOnly = false, category = 'all', size = 20) =>
  (await apiClient.get<NotificationPage>('/notifications', { params: { page, unreadOnly, category, size } })).data,
 read: async (id: number) => { await apiClient.put(`/notifications/${id}/read`) },
 readAll: async (throughId: number) => { await apiClient.put('/notifications/read-all', { throughId }) },
}
export const notificationLabels: Record<string, string> = { COURSE: 'Khóa học', PAYMENT: 'Thanh toán', DISCUSSION: 'Hỏi đáp', REVIEW: 'Kiểm duyệt', CERTIFICATE: 'Chứng nhận' }
