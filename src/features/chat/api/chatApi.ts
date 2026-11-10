import apiClient from '../../../shared/services/apiClient'

export type ChatUser = { id: number; fullName: string; avatarUrl: string | null; roles: string[] }
export type ChatContact = { courseId: number; courseTitle: string; peer: ChatUser }
export type ChatAttachment = { id: number; name: string; contentType: string; bytes: number }
export type ChatMessage = {
  id: number; sender: ChatUser; recipientId: number; courseId: number; clientMessageId: string; content: string; sentAt: string; attachment?: ChatAttachment | null
}
export type ChatDirectory = { content: ChatContact[]; totalPages: number }
export const chatApi = {
  upload: async (file: File, recipientId: number, courseId: number) => {
    const form = new FormData(); form.append('file', file)
    form.append('recipientId', String(recipientId)); form.append('courseId', String(courseId))
    return (await apiClient.post<ChatAttachment>('/chat/attachments', form)).data
  },
  attachment: async (id: number, signal: AbortSignal) =>
    (await apiClient.get<Blob>(`/chat/attachments/${id}`, { responseType: 'blob', signal })).data,
  users: async (query: string, page: number) => (await apiClient.get<ChatDirectory>('/chat/users', { params: { query, page } })).data,
  messages: async (peerId: number, courseId: number, before?: number) =>
    (await apiClient.get<ChatMessage[]>('/chat/messages', { params: { peerId, courseId, before } })).data,
  searchMessages: async (peerId: number, courseId: number, query: string, before?: number) =>
    (await apiClient.get<ChatMessage[]>('/chat/messages/search', { params: { peerId, courseId, query, before } })).data,
  // This authenticated request also refreshes an expired access token using the existing interceptor.
  prepareSocket: () => apiClient.get('/profile'),
  socketUrl: () => {
    const configured = import.meta.env.VITE_CHAT_SOCKET_URL as string | undefined
    if (configured) return configured
    const url = new URL(apiClient.defaults.baseURL ?? '/api/v1', window.location.origin)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = '/ws/chat'; url.search = ''; url.hash = ''
    return url.toString()
  },
}
