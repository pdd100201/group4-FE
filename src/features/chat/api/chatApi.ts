import apiClient from '../../../shared/services/apiClient'

export type ChatUser = { id: number; fullName: string; avatarUrl: string | null; roles: string[] }
export type ChatAttachment = { id: number; name: string; contentType: string; bytes: number }
export type ChatMessage = {
  id: number; sender: ChatUser; recipientId: number | null; clientMessageId: string; content: string; sentAt: string; attachment?: ChatAttachment | null
}
export type ChatDirectory = { content: ChatUser[]; totalPages: number }
export const chatApi = {
  upload: async (file: File, recipientId: number | null) => {
    const form = new FormData(); form.append('file', file)
    if (recipientId !== null) form.append('recipientId', String(recipientId))
    return (await apiClient.post<ChatAttachment>('/chat/attachments', form)).data
  },
  attachment: async (id: number, signal: AbortSignal) =>
    (await apiClient.get<Blob>(`/chat/attachments/${id}`, { responseType: 'blob', signal })).data,
  users: async (query: string, page: number) => (await apiClient.get<ChatDirectory>('/chat/users', { params: { query, page } })).data,
  messages: async (peerId: number | null, before?: number) =>
    (await apiClient.get<ChatMessage[]>('/chat/messages', { params: { peerId: peerId ?? undefined, before } })).data,
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
