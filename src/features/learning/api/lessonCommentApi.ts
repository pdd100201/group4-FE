import apiClient from '../../../shared/services/apiClient'

export type LessonComment = {
  id: number; lessonId: number; parentId: number | null; authorId: number; authorName: string
  avatarUrl: string | null; content: string; createdAt: string
  likeCount: number; likedByMe: boolean; replyCount: number
  edited: boolean; deleted: boolean
}
export type CommentPage = { content: LessonComment[]; totalPages: number; totalElements: number }
const path = (lessonId: number) => `/student/lessons/${lessonId}/comments`
export const lessonCommentApi = {
  list: async (lessonId: number, page: number, parentId?: number) =>
    (await apiClient.get<CommentPage>(path(lessonId), { params: { page, parentId } })).data,
  create: async (lessonId: number, content: string, parentId?: number) =>
    (await apiClient.post<LessonComment>(path(lessonId), { content, parentId })).data,
  like: async (lessonId: number, commentId: number, liked: boolean) =>
    (await apiClient.put<LessonComment>(`${path(lessonId)}/${commentId}/like`, { liked })).data,
  update: async (lessonId: number, commentId: number, content: string) =>
    (await apiClient.put<LessonComment>(`${path(lessonId)}/${commentId}`, { content })).data,
  delete: async (lessonId: number, commentId: number) => {
    await apiClient.delete(`${path(lessonId)}/${commentId}`)
  },
}
