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
  const [threadOpen, setThreadOpen] = useState(false), [sidebarOpen, setSidebarOpen] = useState(true)
  const [sending, setSending] = useState(false)
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width:700px)').matches)
  const messageBox = useRef<HTMLDivElement>(null)
  const history = useChatHistory(contact?.peer.id ?? null, contact?.courseId ?? null, userId), chat = useChatSocket(userId)
  const messages = [...new Map((history.data?.pages.flat() ?? []).map(m => [m.id, m])).values()].sort((a, b) => a.id - b.id)
  const latest = messages.at(-1)?.id

  useEffect(() => {
    const media = window.matchMedia('(max-width:700px)')
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (messageBox.current) messageBox.current.scrollTop = messageBox.current.scrollHeight
  }, [latest, contact?.courseId, contact?.peer.id])

  const choose = (next: ChatContact) => {
    if (sending) return
    setContact(next); setThreadOpen(true); chat.selectConversation(next.courseId, next.peer.id)
  }
  const toggleSidebar = () => compact ? setThreadOpen(open => !open) : setSidebarOpen(open => !open)
  const listVisible = compact ? !threadOpen : sidebarOpen

  // Hide panels with CSS rather than unmounting the thread/composer: drafts and uploads survive logo toggles.
  return <main className={`messenger ${threadOpen ? 'thread-open' : ''} ${!compact && !sidebarOpen ? 'sidebar-collapsed' : ''}`}>
    <ChatContacts contact={contact} chat={chat} sending={sending} listVisible={listVisible} onToggleSidebar={toggleSidebar} choose={choose} />
    <ChatThread contact={contact} userId={userId} chat={chat} history={history} messages={messages} messageBox={messageBox} onBack={() => setThreadOpen(false)}>
      {contact && <ChatComposer key={`${contact.courseId}:${contact.peer.id}`} peerId={contact.peer.id} courseId={contact.courseId} chat={chat} onBusyChange={setSending} />}
    </ChatThread>
  </main>
}
