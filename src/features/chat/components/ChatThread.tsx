import { useState, type ReactNode, type RefObject } from 'react'
import { ChatMessageSearch } from './ChatMessageSearch'
import type { useChatHistory, useChatSocket } from '../../../shared/hooks/useChat'
import type { ChatContact, ChatMessage } from '../api/chatApi'
import { ChatAvatar } from './ChatAvatar'
import { ChatMedia } from './ChatMedia'

type Props = {
  contact: ChatContact | null; userId: number; chat: ReturnType<typeof useChatSocket>
  history: ReturnType<typeof useChatHistory>; messages: ChatMessage[]
  messageBox: RefObject<HTMLDivElement | null>; onBack: () => void; children: ReactNode
}

export function ChatThread({ contact, userId, chat, history, messages, messageBox, onBack, children }: Props) {
  const [searchOpen, setSearchOpen] = useState(false)
  const peer = contact?.peer
  // Message content stays React text so HTML sent by another user cannot execute here.
  return (
    <section className="ms-thread" aria-label="Nội dung cuộc trò chuyện">
      <header className="ms-thread-header"><button className="ms-back" aria-label="Quay lại danh sách chat" onClick={onBack}>‹</button><ChatAvatar person={peer} online={peer ? chat.onlineIds.includes(peer.id) : false} /><div><h2>{contact?.courseTitle ?? 'Chọn khóa học để trò chuyện'}</h2><small>{contact ? `${peer?.fullName} · ${!chat.connected ? 'Đang kết nối…' : chat.onlineIds.includes(peer!.id) ? 'Đang mở chat' : 'Ngoại tuyến'}` : 'Trao đổi riêng với giảng viên hoặc học viên của khóa học'}</small></div>{contact && <button className="ms-thread-search-toggle" aria-label="Tìm tin nhắn" aria-expanded={searchOpen} onClick={() => setSearchOpen(open => !open)}>⌕</button>}<span className={`ms-connection ${chat.connected ? 'connected' : ''}`} aria-label={chat.connected ? 'Đã kết nối' : 'Chưa kết nối'} /></header>
      {chat.connectionError && <p className="ms-notice" role="status">{chat.connectionError}</p>}
      {searchOpen && contact && <ChatMessageSearch key={`search-${contact.courseId}-${peer!.id}`} peerId={peer!.id} courseId={contact.courseId} userId={userId} onClose={() => setSearchOpen(false)} />}
      <div hidden={searchOpen} className="ms-messages" aria-label="Lịch sử tin nhắn" ref={messageBox}>
        {!contact && <p className="ms-hint">Chọn một khóa học trong danh sách để bắt đầu trò chuyện.</p>}
        {contact && history.isPending && <p className="ms-hint">Đang tải tin nhắn…</p>}
        {contact && history.isError && <p className="ms-hint" role="alert">Không tải được tin nhắn. <button onClick={() => void history.refetch()}>Thử lại</button></p>}
        {contact && history.hasNextPage && <button className="ms-older" disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>{history.isFetchingNextPage ? 'Đang tải…' : 'Xem tin nhắn trước'}</button>}
        {contact && history.isSuccess && messages.length === 0 && <div className="ms-empty"><ChatAvatar person={peer} /><h3>{peer?.fullName}</h3><p>Hỏi đáp về {contact.courseTitle} tại đây.</p></div>}
        {messages.map((message, index) => {
          const mine = message.sender.id === userId, previous = messages[index - 1]
          const day = new Date(message.sentAt).toLocaleDateString('vi-VN'), previousDay = previous && new Date(previous.sentAt).toLocaleDateString('vi-VN')
          return <div key={message.id}>{day !== previousDay && <div className="ms-date">{day}</div>}<article className={`ms-message ${mine ? 'mine' : ''}`}>{!mine && <ChatAvatar person={message.sender} />}<div className="ms-message-body">{!mine && <small className="ms-sender">{message.sender.fullName}</small>}{message.attachment && <ChatMedia file={message.attachment} onLoaded={() => { const box = messageBox.current; if (box && box.scrollHeight - box.scrollTop - box.clientHeight < 400) box.scrollTop = box.scrollHeight }} />}{message.content && <p className="ms-bubble">{message.content}</p>}<time dateTime={message.sentAt}>{new Date(message.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time></div></article></div>
        })}
      </div>
      {children}
    </section>
  )
}
