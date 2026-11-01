import apiClient from '../../../shared/services/apiClient'
import type { BlogComment, BlogPage, BlogPost } from '../../blog/api/blogApi'

export type ManagedPostStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED'
export interface ManagedPost { post: BlogPost; content: string; published: boolean; status: ManagedPostStatus }
export interface PostInput {
  title: string
  category: string
  summary: string
  content: string
  thumbnailMediaId: number | null
  published: boolean
}
export type ModerationStatus = 'VISIBLE' | 'HIDDEN' | 'DISABLED'

export const managerPostApi = {
  list: async (page: number, size = 10) => (await apiClient.get<BlogPage<ManagedPost>>('/manager/posts', { params: { page, size } })).data,
  detail: async (id: number) => (await apiClient.get<ManagedPost>(`/manager/posts/${id}`)).data,
  create: async (input: PostInput) => (await apiClient.post<ManagedPost>('/manager/posts', input)).data,
  update: async (id: number, input: PostInput) => (await apiClient.put<ManagedPost>(`/manager/posts/${id}`, input)).data,
  review: async (id: number, decision: 'APPROVE' | 'REJECT') => (await apiClient.patch<ManagedPost>(`/manager/posts/${id}/review`, { decision })).data,
  delete: async (id: number) => { await apiClient.delete(`/manager/posts/${id}`) },
  moderationComments: async (postId: number, status: ModerationStatus | '', page: number) => (await apiClient.get<BlogPage<BlogComment>>(`/manager/posts/${postId}/comments`, { params: { page, size: 10, ...(status ? { status } : {}) } })).data,
  setCommentStatus: async (id: number, status: ModerationStatus) => (await apiClient.patch<BlogComment>(`/comments/${id}/status`, { status })).data,
  deleteComment: async (id: number) => { await apiClient.delete(`/comments/${id}`) },
}
