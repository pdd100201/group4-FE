import apiClient from '../../../shared/services/apiClient'
export type DiscussionPage<T> = { content: T[]; totalPages: number; totalElements: number }
export type DiscussionQuestion = {
 id: number; courseId: number; courseTitle: string; lessonId: number; lessonTitle: string
 authorId: number; authorName: string; title: string; content: string; createdAt: string
 hidden: boolean; acceptedAnswerId: number | null; canResolve: boolean; canModerate: boolean; canReply: boolean
}
export type DiscussionAnswer = { id: number; authorId: number; authorName: string; content: string; createdAt: string; hidden: boolean; expert: boolean }
export const discussionApi = {
 list: async (lessonId: number | undefined, search: string, state: string, page: number) =>
  (await apiClient.get<DiscussionPage<DiscussionQuestion>>('/discussions', { params: { lessonId, search, state, page } })).data,
 detail: async (id: number, page: number) =>
  (await apiClient.get<{ question: DiscussionQuestion; answers: DiscussionPage<DiscussionAnswer> }>(`/discussions/${id}`, { params: { page } })).data,
 create: async (lessonId: number, title: string, content: string) =>
  (await apiClient.post<DiscussionQuestion>('/discussions', { lessonId, title, content })).data,
 reply: async (id: number, content: string) => { await apiClient.post(`/discussions/${id}/answers`, { content }) },
 resolve: async (id: number, answerId: number | null) => { await apiClient.put(`/discussions/${id}/resolution`, { answerId }) },
 visibility: async (id: number, hidden: boolean, answerId?: number) => {
  await apiClient.put(`/discussions/${id}${answerId === undefined ? '' : `/answers/${answerId}`}/visibility`, { hidden })
 },
}