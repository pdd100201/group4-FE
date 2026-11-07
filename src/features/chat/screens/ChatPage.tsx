import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../shared/context/AuthContext'
import { useChatHistory, useChatSocket } from '../../../shared/hooks/useChat'
import type { ChatUser } from '../api/chatApi'
import { ChatContacts } from '../components/ChatContacts'
import { ChatThread } from '../components/ChatThread'
import { ChatComposer } from '../components/ChatComposer'
import './messenger.css'

export function ChatPage() {
  const { user } = useAuth()
  return user ? <Workspace userId={user.id} /> : null
}

function Workspace({ userId }: { userId: number }) {
  const [peer, setPeer] = useState<ChatUser | null>(null)
  const [threadOpen, setThreadOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const messageBox = useRef<HTMLDivElement>(null)
  const history = useChatHistory(peer?.id ?? null, userId), chat = useChatSocket(userId)
  const messages = [...new Map((history.data?.pages.flat() ?? []).map(m => [m.id, m])).values()].sort((a, b) => a.id - b.id)
  const latest = messages.at(-1)?.id

  useEffect(() => {
    if (messageBox.current) messageBox.current.scrollTop = messageBox.current.scrollHeight
  }, [latest, peer?.id])

  const choose = (next: ChatUser | null) => {
    if (sending) return
    setPeer(next); setThreadOpen(true); chat.selectPeer(next?.id ?? null)
  }
  // Hide panels with CSS rather than unmounting the thread/composer: drafts and uploads survive mobile navigation.
  return <main className={`messenger ${threadOpen ? 'thread-open' : ''}`}>
    <ChatContacts peer={peer} chat={chat} sending={sending} choose={choose} />
    <ChatThread peer={peer} userId={userId} chat={chat} history={history} messages={messages} messageBox={messageBox} onBack={() => setThreadOpen(false)}>
      <ChatComposer key={peer?.id ?? 'community'} peerId={peer?.id ?? null} chat={chat} onBusyChange={setSending} />
    </ChatThread>
  </main>
}
