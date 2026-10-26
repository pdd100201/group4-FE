import { useState } from 'react'
import { useChatMessageSearch, useDebouncedChatSearch } from '../../../shared/hooks/useChat'

export function ChatMessageSearch({ peerId, userId, onClose }: { peerId: number | null; userId: number; onClose: () => void }) {
  const [input, setInput] = useState('')
  const query = useDebouncedChatSearch(input)
  const results = useChatMessageSearch(peerId, userId, query)
  const waiting = input.trim() !== query
  const messages = waiting ? [] : results.data?.pages.flat() ?? []
  return <div className="ms-message-search">
    <form className="ms-search" onSubmit={e => e.preventDefault()}>
      <input autoFocus aria-label="Tìm tin nhắn trong cuộc trò chuyện" placeholder="Nhập nội dung tin nhắn…" maxLength={100} value={input} onChange={e => setInput(e.target.value)} />
      <button type="button" aria-label="Đóng tìm tin nhắn" onClick={onClose}>×</button>
    </form>
    <div className="ms-search-results" aria-live="polite" aria-label="Kết quả tìm tin nhắn">
      {!input.trim() && <p className="ms-hint">Tìm nội dung trong cuộc trò chuyện này.</p>}
      {input.trim() && (waiting || results.isFetching && !results.isFetchingNextPage) && <p className="ms-hint">Đang tìm…</p>}
      {query && !waiting && results.isError && <p role="alert">Không tìm được tin nhắn. <button onClick={() => void results.refetch()}>Thử lại</button></p>}
      {query && !waiting && results.isSuccess && messages.length === 0 && <p className="ms-hint">Không có tin nhắn phù hợp.</p>}
      {messages.map(message => <article className="ms-search-result" key={message.id}>
        <strong>{message.sender.fullName}</strong><time dateTime={message.sentAt}>{new Date(message.sentAt).toLocaleString('vi-VN')}</time>
        <p>{highlight(message.content, query)}</p>
      </article>)}
      {!waiting && results.hasNextPage && <button className="ms-older" disabled={results.isFetchingNextPage} onClick={() => void results.fetchNextPage()}>Xem kết quả trước</button>}
    </div>
  </div>
}

function highlight(text: string, query: string) {
  if (!query) return text
  const parts = [], lower = text.toLocaleLowerCase(), needle = query.toLocaleLowerCase()
  let start = 0, index = lower.indexOf(needle)
  while (index !== -1) {
    parts.push(text.slice(start, index), <mark key={index}>{text.slice(index, index + query.length)}</mark>)
    start = index + query.length; index = lower.indexOf(needle, start)
  }
  parts.push(text.slice(start)); return parts
}
