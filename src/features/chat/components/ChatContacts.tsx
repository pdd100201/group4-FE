import { useState } from 'react'
import { useChatUsers, useDebouncedChatSearch } from '../../../shared/hooks/useChat'
import type { useChatSocket } from '../../../shared/hooks/useChat'
import type { ChatUser } from '../api/chatApi'
import { ChatAvatar } from './ChatAvatar'

type Props = {
  peer: ChatUser | null; chat: ReturnType<typeof useChatSocket>; sending: boolean
  listVisible: boolean; onToggleSidebar: () => void; choose: (peer: ChatUser | null) => void
}

export function ChatContacts({ peer, chat, sending, listVisible, onToggleSidebar, choose }: Props) {
  // Search/pagination belong to the directory, independently of the active conversation and draft.
  const [search, setSearch] = useState(''), [page, setPage] = useState(0)
  const query = useDebouncedChatSearch(search)
  const directory = useChatUsers(query, page)
  const waiting = search.trim() !== query
  const people = waiting ? [] : directory.data?.content ?? []
  return <>
    <nav className="ms-rail" aria-label="Liên hệ nhanh"><button type="button" className="ms-rail-brand" aria-label={listVisible ? 'Ẩn đoạn chat' : 'Hiện đoạn chat'} title={listVisible ? 'Ẩn đoạn chat' : 'Hiện đoạn chat'} aria-expanded={listVisible} aria-controls="chat-conversation-list" onClick={onToggleSidebar}><b className="ms-web-logo" aria-hidden="true">E</b></button>
      <button className={`ms-rail-person ${peer === null ? 'active' : ''}`} title="Phòng chat chung" aria-label="Phòng chat chung" onClick={() => choose(null)} disabled={sending}><ChatAvatar community online={chat.connected} /></button>
      <div className="ms-rail-people">{people.map(person => <button key={person.id} className={`ms-rail-person ${peer?.id === person.id ? 'active' : ''}`} title={person.fullName} aria-label={`Chat với ${person.fullName}`} disabled={sending} onClick={() => choose(person)}><ChatAvatar person={person} online={chat.onlineIds.includes(person.id)} />{Boolean(chat.unread[String(person.id)]) && <b className="ms-dot-badge" />}</button>)}</div>
    </nav>
    <aside id="chat-conversation-list" className="ms-sidebar" aria-label="Danh sách trò chuyện">
      <header><div><small>EDULEARN</small><h1>Đoạn chat</h1></div></header>
      <form className="ms-search" onSubmit={e => { e.preventDefault(); setPage(0) }}><input aria-label="Tìm người dùng" placeholder="Tìm theo tên cá nhân" value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setPage(0) }} /><button aria-label="Tìm kiếm" type="submit">⌕</button></form>
      <p className="ms-section-label">{search.trim() ? 'Kết quả theo tên' : 'Trò chuyện với mọi người'}</p>
      <div className="ms-conversations">
        {!search.trim() && <button className={`ms-person ${peer === null ? 'selected' : ''}`} onClick={() => choose(null)} disabled={sending}><ChatAvatar community online={chat.connected} /><span className="ms-person-text"><strong>Phòng chat chung</strong><small>Tất cả thành viên EduLearn</small></span>{Boolean(chat.unread.null) && <b className="ms-unread">{chat.unread.null}</b>}</button>}
        {(directory.isPending || waiting) && <p className="ms-hint">Đang tải liên hệ…</p>}
        {!waiting && directory.isError && <p className="ms-hint" role="alert">Không tải được liên hệ. <button onClick={() => void directory.refetch()}>Thử lại</button></p>}
        {!waiting && directory.data?.content.length === 0 && <p className="ms-hint">Không tìm thấy người dùng.</p>}
        {people.map(person => <button key={person.id} className={`ms-person ${peer?.id === person.id ? 'selected' : ''}`} onClick={() => choose(person)} disabled={sending}><ChatAvatar person={person} online={chat.onlineIds.includes(person.id)} /><span className="ms-person-text"><strong>{person.fullName}</strong><small>{chat.onlineIds.includes(person.id) ? 'Đang mở chat' : person.roles.map(r => ({ STUDENT: 'Học viên', EXPERT: 'Giảng viên', ADMIN: 'Quản trị viên', MANAGER: 'Quản lý' })[r] ?? r).join(', ')}</small></span>{Boolean(chat.unread[String(person.id)]) && <b className="ms-unread">{chat.unread[String(person.id)]}</b>}</button>)}
      </div>
      {!waiting && directory.data && directory.data.totalPages > 1 && <div className="ms-pagination"><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</button><span>{page + 1}/{directory.data.totalPages}</span><button disabled={page + 1 >= directory.data.totalPages} onClick={() => setPage(p => p + 1)}>Sau</button></div>}
      <p className="ms-sidebar-note">Ảnh, video và những cuộc trò chuyện.</p>
    </aside>
  </>
}
