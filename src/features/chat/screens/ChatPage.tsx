import { useEffect, useRef, useState } from 'react'
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
  const [contact, setContact] = useState<ChatContact | null>(null)
  const [threadOpen, setThreadOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const messageBox = useRef<HTMLDivElement>(null)
  const history = useChatHistory(contact?.peer.id ?? null, contact?.courseId ?? null, userId), chat = useChatSocket(userId)
  const messages = [...new Map((history.data?.pages.flat() ?? []).map(m => [m.id, m])).values()].sort((a, b) => a.id - b.id)
  const latest = messages.at(-1)?.id

  useEffect(() => {
    if (messageBox.current) messageBox.current.scrollTop = messageBox.current.scrollHeight
  }, [latest, contact?.courseId, contact?.peer.id])

  const choose = (next: ChatContact) => {
    if (sending) return
    setContact(next); setThreadOpen(true); chat.selectConversation(next.courseId, next.peer.id)
  }
  // Hide panels with CSS rather than unmounting the thread/composer: drafts and uploads survive mobile navigation.
  return <main className={`messenger ${threadOpen ? 'thread-open' : ''}`}>
    <ChatContacts contact={contact} chat={chat} sending={sending} choose={choose} />
    <ChatThread contact={contact} userId={userId} chat={chat} history={history} messages={messages} messageBox={messageBox} onBack={() => setThreadOpen(false)}>
      {contact && <ChatComposer key={`${contact.courseId}:${contact.peer.id}`} peerId={contact.peer.id} courseId={contact.courseId} chat={chat} onBusyChange={setSending} />}
    </ChatThread>
  </main>
}
