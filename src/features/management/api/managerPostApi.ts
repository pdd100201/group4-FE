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

function createPostManagementApi(role: 'admin' | 'manager') {
  const base = `/${role}/posts`
  return {
  list: async (page: number, size = 10) => (await apiClient.get<BlogPage<ManagedPost>>(base, { params: { page, size } })).data,
  detail: async (id: number) => (await apiClient.get<ManagedPost>(`${base}/${id}`)).data,
  create: async (input: PostInput) => (await apiClient.post<ManagedPost>(base, input)).data,
  update: async (id: number, input: PostInput) => (await apiClient.put<ManagedPost>(`${base}/${id}`, input)).data,
  review: async (id: number, decision: 'APPROVE' | 'REJECT') => (await apiClient.patch<ManagedPost>(`${base}/${id}/review`, { decision })).data,
  delete: async (id: number) => { await apiClient.delete(`${base}/${id}`) },
  moderationComments: async (postId: number, status: ModerationStatus | '', page: number) => (await apiClient.get<BlogPage<BlogComment>>(`${base}/${postId}/comments`, { params: { page, size: 10, ...(status ? { status } : {}) } })).data,
  setCommentStatus: async (id: number, status: ModerationStatus) => (await apiClient.patch<BlogComment>(`/comments/${id}/status`, { status })).data,
  deleteComment: async (id: number) => { await apiClient.delete(`/comments/${id}`) },
}

}

export const managerPostApi = createPostManagementApi('manager')
export const adminPostApi = createPostManagementApi('admin')
