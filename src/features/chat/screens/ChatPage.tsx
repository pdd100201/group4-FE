import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../../shared/services/apiClient'
import { useAuth } from '../../../shared/context/AuthContext'
import { useChatHistory, useChatSocket } from '../../../shared/hooks/useChat'
import type { ChatContact } from '../api/chatApi'
import { ChatContacts } from '../components/ChatContacts'
import { ChatThread } from '../components/ChatThread'
import { ChatComposer } from '../components/ChatComposer'
import './messenger.css'

export function ChatPage() {
  const { user } = useAuth()
  return user ? <Workspace userId={user.id} /> : null
}

function Workspace({ userId }: { userId: number }) {
  const [params] = useSearchParams()
  const courseId = Number(params.get('courseId')), peerId = Number(params.get('peerId'))
  const requested = useQuery({ queryKey: ['chat-contact', userId, courseId, peerId], enabled: Number.isSafeInteger(courseId) && courseId > 0 && Number.isSafeInteger(peerId) && peerId > 0,
    queryFn: async () => (await apiClient.get<ChatContact>('/chat/contact', { params: { courseId, peerId } })).data })
  const [contact, setContact] = useState<ChatContact | null>(null)
  const [threadOpen, setThreadOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const messageBox = useRef<HTMLDivElement>(null)
  const history = useChatHistory(contact?.peer.id ?? null, contact?.courseId ?? null, userId), chat = useChatSocket(userId)
  const messages = [...new Map((history.data?.pages.flat() ?? []).map(m => [m.id, m])).values()].sort((a, b) => a.id - b.id)
  const latest = messages.at(-1)?.id
  useEffect(() => {
    if (requested.data) { setContact(requested.data); setThreadOpen(true); chat.selectConversation(requested.data.peer.id) }
  }, [requested.data, chat.selectConversation])

  useEffect(() => {
    if (messageBox.current) messageBox.current.scrollTop = messageBox.current.scrollHeight
  }, [latest, contact?.peer.id])

  const choose = (next: ChatContact) => {
    if (sending) return
    setContact(next); setThreadOpen(true); chat.selectConversation(next.peer.id)
  }
  return <main className={`messenger ${threadOpen ? 'thread-open' : ''}`}>
    {requested.isError && <p className="ms-notice" role="alert">Không thể mở cuộc trò chuyện. Quyền học có thể đã hết hạn.</p>}
    <ChatContacts contact={contact} chat={chat} sending={sending} choose={choose} />
    <ChatThread contact={contact} userId={userId} chat={chat} history={history} messages={messages} messageBox={messageBox} onBack={() => setThreadOpen(false)}>
      {contact && <ChatComposer key={contact.peer.id} peerId={contact.peer.id} courseId={contact.courseId} chat={chat} onBusyChange={setSending} />}
    </ChatThread>
  </main>
}
