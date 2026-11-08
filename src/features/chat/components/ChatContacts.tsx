import { useState } from 'react'
import { useChatUsers, useDebouncedChatSearch } from '../../../shared/hooks/useChat'
import type { useChatSocket } from '../../../shared/hooks/useChat'
import type { ChatContact } from '../api/chatApi'
import { ChatAvatar } from './ChatAvatar'

type Props = {
  contact: ChatContact | null; chat: ReturnType<typeof useChatSocket>; sending: boolean
  choose: (contact: ChatContact) => void
}

export function ChatContacts({ contact, chat, sending, choose }: Props) {
  const [search, setSearch] = useState(''), [page, setPage] = useState(0)
  const query = useDebouncedChatSearch(search)
  const directory = useChatUsers(query, page)
  const waiting = search.trim() !== query
  const contacts = waiting ? [] : directory.data?.content ?? []
  const key = (item: ChatContact) => `${item.courseId}:${item.peer.id}`
  const selected = (item: ChatContact) => contact !== null && key(item) === key(contact)
  return <>
    <aside id="chat-conversation-list" className="ms-sidebar" aria-label="Danh sách trò chuyện">
      <header><div><small>EDULEARN</small><h1>Trao đổi khóa học</h1></div></header>
      <form className="ms-search" onSubmit={e => { e.preventDefault(); setPage(0) }}><input aria-label="Tìm khóa học hoặc người trò chuyện" placeholder="Tìm khóa học hoặc người trò chuyện" value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setPage(0) }} /><button aria-label="Tìm kiếm" type="submit">⌕</button></form>
      <p className="ms-section-label">Cuộc trò chuyện theo khóa học</p>
      <div className="ms-conversations">
        {(directory.isPending || waiting) && <p className="ms-hint">Đang tải khóa học…</p>}
        {!waiting && directory.isError && <p className="ms-hint" role="alert">Không tải được liên hệ. <button onClick={() => void directory.refetch()}>Thử lại</button></p>}
        {!waiting && directory.data?.content.length === 0 && <p className="ms-hint">Chưa có khóa học đang học hoặc học viên cần hỗ trợ.</p>}
        {contacts.map(item => <button key={key(item)} className={`ms-person ${selected(item) ? 'selected' : ''}`} onClick={() => choose(item)} disabled={sending}><ChatAvatar person={item.peer} online={chat.onlineIds.includes(item.peer.id)} /><span className="ms-person-text"><strong>{item.courseTitle}</strong><small>{item.peer.fullName} · {chat.onlineIds.includes(item.peer.id) ? 'Đang mở chat' : 'Ngoại tuyến'}</small></span>{Boolean(chat.unread[key(item)]) && <b className="ms-unread">{chat.unread[key(item)]}</b>}</button>)}
      </div>
      {!waiting && directory.data && directory.data.totalPages > 1 && <div className="ms-pagination"><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</button><span>{page + 1}/{directory.data.totalPages}</span><button disabled={page + 1 >= directory.data.totalPages} onClick={() => setPage(p => p + 1)}>Sau</button></div>}
      <p className="ms-sidebar-note">Mỗi khóa học có một cuộc trò chuyện riêng.</p>
    </aside>
  </>
}
