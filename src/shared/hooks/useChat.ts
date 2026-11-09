import { useCallback, useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { chatApi, type ChatMessage } from '../../features/chat/api/chatApi'
import { authStorage } from '../utils/authStorage'

export const useChatUsers = (query: string, page: number) => useQuery({
  queryKey: ['chat', 'users', query, page], queryFn: () => chatApi.users(query, page),
})
export const useChatHistory = (peerId: number | null, courseId: number | null, userId: number) => useInfiniteQuery({
  queryKey: ['chat', 'messages', userId, courseId, peerId],
  queryFn: ({ pageParam }) => chatApi.messages(peerId!, courseId!, pageParam),
  enabled: peerId !== null && courseId !== null,
  initialPageParam: undefined as number | undefined,
  getNextPageParam: last => last.length >= 50 ? last[0].id : undefined,
})

export function useDebouncedChatSearch(value: string) {
  const [query, setQuery] = useState(value.trim())
  useEffect(() => { const timer = setTimeout(() => setQuery(value.trim()), 250); return () => clearTimeout(timer) }, [value])
  return query
}

export const useChatMessageSearch = (peerId: number, courseId: number, userId: number, query: string) => useInfiniteQuery({
  queryKey: ['chat', 'search', userId, courseId, peerId, query],
  queryFn: ({ pageParam }) => chatApi.searchMessages(peerId, courseId, query, pageParam),
  enabled: Boolean(query), staleTime: 0,
  initialPageParam: undefined as number | undefined,
  getNextPageParam: last => last.length >= 50 ? last[last.length - 1].id : undefined,
})

type Pending = { resolve: () => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }
type SocketEvent = { type: string; message?: ChatMessage | string; clientMessageId?: string; userIds?: number[] }

export function useChatSocket(userId: number) {
  const cache = useQueryClient()
  const socket = useRef<WebSocket | null>(null)
  const pending = useRef(new Map<string, Pending>())
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [unread, setUnread] = useState<Record<string, number>>({})
  const activeConversation = useRef<string | null>(null)
  const [onlineIds, setOnlineIds] = useState<number[]>([])

  useEffect(() => {
    let disposed = false, retry: ReturnType<typeof setTimeout> | undefined, heartbeat: ReturnType<typeof setInterval> | undefined
    let attempt = 0
    const waiting = pending.current
    const failPending = () => {
      waiting.forEach(p => { clearTimeout(p.timer); p.reject(new Error('Kết nối bị gián đoạn. Bạn có thể gửi lại tin nhắn.')) }); waiting.clear()
    }
    const reconnect = () => {
      if (!disposed) retry = setTimeout(() => { void connect() }, Math.min(20_000, 1000 * 2 ** Math.min(attempt++, 4)))
    }
    const connect = async () => {
      try {
        await chatApi.prepareSocket()
        if (disposed) return
        const ws = new WebSocket(chatApi.socketUrl()); socket.current = ws
        // Authenticate in a frame rather than putting a bearer token into the socket URL/logs.
        ws.onopen = () => ws.send(JSON.stringify({ type: 'AUTH', token: authStorage.accessToken() }))
        ws.onmessage = event => {
          if (disposed) return
          let data: SocketEvent
          try { data = JSON.parse(String(event.data)) as SocketEvent } catch { return }
          if (data.type === 'PRESENCE' && Array.isArray(data.userIds)) setOnlineIds(data.userIds)
          if (data.type === 'READY') {
            attempt = 0; setConnected(true); setConnectionError('')
            void cache.invalidateQueries({ queryKey: ['chat', 'messages', userId] })
            heartbeat = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'PING' })) }, 20_000)
          }
          if (data.type === 'MESSAGE' && typeof data.message === 'object' && data.message) {
            const message = data.message
            if (message.courseId == null || !message.recipientId) return
            const peer = message.sender.id === userId ? message.recipientId : message.sender.id
            const conversation = `${message.courseId}:${peer}`
            // Server delivery is authoritative; cache keys isolate each user's course conversation.
            const key = ['chat', 'messages', userId, message.courseId, peer]
            const previous = cache.getQueryData<InfiniteData<ChatMessage[]>>(key)
            const needsHistory = !previous
            const duplicate = previous?.pages.some(page => page.some(m => m.id === message.id))
            cache.setQueryData<InfiniteData<ChatMessage[]>>(key, old => {
              if (!old) return { pages: [[message]], pageParams: [undefined] }
              if (old.pages.some(page => page.some(m => m.id === message.id))) return old
              return { ...old, pages: [[...old.pages[0], message].sort((a, b) => a.id - b.id), ...old.pages.slice(1)] }
            })
            if (needsHistory) void cache.invalidateQueries({ queryKey: key })
            if (!duplicate && message.sender.id !== userId && conversation !== activeConversation.current) {
              setUnread(old => ({ ...old, [conversation]: (old[conversation] ?? 0) + 1 }))
            }
            const p = waiting.get(message.clientMessageId)
            if (p) { clearTimeout(p.timer); waiting.delete(message.clientMessageId); p.resolve() }
          }
          if (data.type === 'ERROR') {
            const error = typeof data.message === 'string' ? data.message : 'Không gửi được tin nhắn.'
            const p = data.clientMessageId ? waiting.get(data.clientMessageId) : undefined
            if (p && data.clientMessageId) { clearTimeout(p.timer); waiting.delete(data.clientMessageId); p.reject(new Error(error)) }
            else setConnectionError(error)
          }
        }
        ws.onclose = () => {
          if (heartbeat) clearInterval(heartbeat)
          failPending()
          if (!disposed) { setConnected(false); setOnlineIds([]); setConnectionError('Mất kết nối. Đang kết nối lại…'); reconnect() }
        }
        ws.onerror = () => ws.close()
      } catch {
        if (!disposed) { setConnected(false); setConnectionError('Chưa kết nối được chat. Đang thử lại…'); reconnect() }
      }
    }
    void connect()
    return () => {
      disposed = true; clearTimeout(retry); clearInterval(heartbeat); socket.current?.close(); socket.current = null; failPending()
      // Chat history belongs to the signed-in user and must not remain in another user's view.
      cache.removeQueries({ queryKey: ['chat'] })
    }
  }, [cache, userId])

  const selectConversation = useCallback((courseId: number, peerId: number) => {
    const key = `${courseId}:${peerId}`
    activeConversation.current = key
    setUnread(old => ({ ...old, [key]: 0 }))
  }, [])
  const send = useCallback((recipientId: number, courseId: number, content: string, clientMessageId: string, attachmentId?: number) => new Promise<void>((resolve, reject) => {
    const ws = socket.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !connected) { reject(new Error('Chat chưa kết nối. Vui lòng thử lại sau.')); return }
    const timer = setTimeout(() => { pending.current.delete(clientMessageId); reject(new Error('Chưa nhận được xác nhận. Bạn có thể gửi lại an toàn.')) }, 12_000)
    pending.current.set(clientMessageId, { resolve, reject, timer })
    try { ws.send(JSON.stringify({ type: 'SEND', recipientId, courseId, content, clientMessageId, attachmentId })) }
    catch { clearTimeout(timer); pending.current.delete(clientMessageId); reject(new Error('Không gửi được tin nhắn.')) }
  }), [connected])
  return { connected, connectionError, send, unread, selectConversation, onlineIds }
}
