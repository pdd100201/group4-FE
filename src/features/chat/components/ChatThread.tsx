import type { ReactNode, RefObject } from 'react'
import type { useChatHistory, useChatSocket } from '../../../shared/hooks/useChat'
import type { ChatMessage, ChatUser } from '../api/chatApi'
import { ChatAvatar } from './ChatAvatar'
import { ChatMedia } from './ChatMedia'

type Props = {
  peer: ChatUser | null; userId: number; chat: ReturnType<typeof useChatSocket>
  history: ReturnType<typeof useChatHistory>; messages: ChatMessage[]
  messageBox: RefObject<HTMLDivElement | null>; onBack: () => void; children: ReactNode
}

export function ChatThread({ peer, userId, chat, history, messages, messageBox, onBack, children }: Props) {
  // Message content stays React text so HTML sent by another user cannot execute here.
  return (
    <section className="ms-thread" aria-label="Nội dung cuộc trò chuyện">
      <header className="ms-thread-header"><button className="ms-back" aria-label="Quay lại danh sách chat" onClick={onBack}>‹</button><ChatAvatar person={peer ?? undefined} community={!peer} online={peer ? chat.onlineIds.includes(peer.id) : chat.connected} /><div><h2>{peer?.fullName ?? 'Phòng chat chung'}</h2><small>{!chat.connected ? 'Đang kết nối…' : !peer ? 'Không gian trò chuyện của mọi người' : chat.onlineIds.includes(peer.id) ? 'Đang mở chat' : 'Ngoại tuyến'}</small></div><span className={`ms-connection ${chat.connected ? 'connected' : ''}`} aria-label={chat.connected ? 'Đã kết nối' : 'Chưa kết nối'} /></header>
      {chat.connectionError && <p className="ms-notice" role="status">{chat.connectionError}</p>}
      <div className="ms-messages" aria-label="Lịch sử tin nhắn" ref={messageBox}>
        {history.isPending && <p className="ms-hint">Đang tải tin nhắn…</p>}
        {history.isError && <p className="ms-hint" role="alert">Không tải được tin nhắn. <button onClick={() => void history.refetch()}>Thử lại</button></p>}
        {history.hasNextPage && <button className="ms-older" disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>{history.isFetchingNextPage ? 'Đang tải…' : 'Xem tin nhắn trước'}</button>}
        {history.isSuccess && messages.length === 0 && <div className="ms-empty"><ChatAvatar person={peer ?? undefined} community={!peer} /><h3>{peer?.fullName ?? 'Chào mừng đến phòng chung'}</h3><p>Gửi lời chào, chia sẻ một bức ảnh<br />hoặc bắt đầu câu chuyện của bạn.</p></div>}
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
