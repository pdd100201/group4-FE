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
export type ModerationStatus = 'VISIBLE' | 'HIDDEN'
export type PostManagementRole = 'manager' | 'admin'
export const managerPostPageSize = 10

const postsPath = (role: PostManagementRole) => `/${role}/posts`

export const managerPostApi = {
  list: async (page: number, size = 10, role: PostManagementRole = 'manager') => (await apiClient.get<BlogPage<ManagedPost>>(postsPath(role), { params: { page, size } })).data,
  detail: async (id: number, role: PostManagementRole = 'manager') => (await apiClient.get<ManagedPost>(`${postsPath(role)}/${id}`)).data,
  create: async (input: PostInput, role: PostManagementRole = 'manager') => (await apiClient.post<ManagedPost>(postsPath(role), input)).data,
  update: async (id: number, input: PostInput, role: PostManagementRole = 'manager') => (await apiClient.put<ManagedPost>(`${postsPath(role)}/${id}`, input)).data,
  review: async (id: number, decision: 'APPROVE' | 'REJECT', role: PostManagementRole = 'manager') => (await apiClient.patch<ManagedPost>(`${postsPath(role)}/${id}/review`, { decision })).data,
  delete: async (id: number, role: PostManagementRole = 'manager') => { await apiClient.delete(`${postsPath(role)}/${id}`) },
  moderationComments: async (postId: number, status: ModerationStatus | '', page: number, role: PostManagementRole = 'manager') => (await apiClient.get<BlogPage<BlogComment>>(`${postsPath(role)}/${postId}/comments`, { params: { page, size: 10, ...(status ? { status } : {}) } })).data,
  setCommentStatus: async (id: number, status: ModerationStatus) => (await apiClient.patch<BlogComment>(`/comments/${id}/status`, { status })).data,
  deleteComment: async (id: number) => { await apiClient.delete(`/comments/${id}`) },
}
