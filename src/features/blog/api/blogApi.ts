import apiClient from '../../../shared/services/apiClient'

export interface BlogPage<T> { content: T[]; totalElements: number; totalPages: number; number: number }
export interface BlogPost {
  id: number; title: string; category: string | null; thumbnailUrl: string | null; summary: string | null
  authorName: string; createdAt: string | null; updatedAt: string | null
}
export interface BlogDetail { post: BlogPost; content: string }
export interface PostFilters { search?: string; category?: string; page?: number; size?: number }
export interface BlogComment {
  id: number; postId: number; postTitle: string; authorName: string; avatarUrl: string | null; content: string
  status: 'VISIBLE' | 'HIDDEN' | 'DISABLED' | 'DELETED'; createdAt: string | null; updatedAt: string | null
  canEdit: boolean; canDelete: boolean
}
export const blogApi = {
  list: async (params: PostFilters): Promise<BlogPage<BlogPost>> => (await apiClient.get<BlogPage<BlogPost>>('/public/posts', { params })).data,
  categories: async (): Promise<string[]> => (await apiClient.get<string[]>('/public/posts/categories')).data,
  detail: async (id: number): Promise<BlogDetail> => (await apiClient.get<BlogDetail>(`/public/posts/${id}`)).data,
  comments: async (id: number, page: number): Promise<BlogPage<BlogComment>> => (await apiClient.get<BlogPage<BlogComment>>(`/public/posts/${id}/comments`, { params: { page, size: 10 } })).data,
  comment: async (postId: number, id: number): Promise<BlogComment> => (await apiClient.get<BlogComment>(`/public/posts/${postId}/comments/${id}`)).data,
  createComment: async (postId: number, content: string): Promise<BlogComment> => (await apiClient.post<BlogComment>(`/student/posts/${postId}/comments`, { content })).data,
  editComment: async (id: number, content: string): Promise<BlogComment> => (await apiClient.put<BlogComment>(`/student/comments/${id}`, { content })).data,
  deleteComment: async (id: number): Promise<void> => { await apiClient.delete(`/comments/${id}`) },
}
