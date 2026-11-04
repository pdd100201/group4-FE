import { isAxiosError } from 'axios'
import type { DiscussionQuestion } from '../api/discussionApi'

type IconName = 'message' | 'search' | 'book' | 'send' | 'check' | 'refresh' | 'arrowLeft' | 'arrowRight' | 'close'
export function DiscussionIcon({ name, className = '' }: { name: IconName; className?: string }) {
 const paths: Record<IconName, React.ReactNode> = {
  message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9H13a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M8 11h8M8 15h5"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
  book: <><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z"/><path d="M12 5v15"/></>,
  send: <><path d="m22 2-7 20-4-9-9-4L22 2Z"/><path d="m22 2-11 11"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 6a8 8 0 0 1 13 3M18 18A8 8 0 0 1 5 15"/></>,
  arrowLeft: <path d="m15 18-6-6 6-6"/>,
  arrowRight: <path d="m9 18 6-6-6-6"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
 }
 return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
export function DiscussionAvatar({ name, expert = false }: { name: string; expert?: boolean }) {
 const parts = name.trim().split(/\s+/)
 const initials = (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toLocaleUpperCase('vi')
 return <span className={`discussion-avatar ${expert ? 'discussion-avatar-expert' : ''}`} aria-hidden="true">{initials || '?'}</span>
}
export function DiscussionStatus({ question }: { question: DiscussionQuestion }) {
 const tone = question.hidden ? 'hidden' : question.acceptedAnswerId ? 'resolved' : 'open'
 return <span className={`discussion-status discussion-status-${tone}`}>{tone === 'resolved' ? <DiscussionIcon name="check" /> : <span className="discussion-status-dot" />}{tone === 'hidden' ? 'Đã ẩn' : tone === 'resolved' ? 'Đã giải quyết' : 'Chưa giải quyết'}</span>
}
export function discussionErrorText(error: unknown) {
 return isAxiosError(error) && typeof error.response?.data?.message === 'string'
  ? error.response.data.message : 'Không thể thực hiện thao tác. Vui lòng thử lại.'
}
export function DiscussionError({ error, retry }: { error: unknown; retry?: () => void }) {
 return <div className="discussion-error" role="alert"><p>{discussionErrorText(error)}</p>{retry && <button className="discussion-button discussion-button-secondary" type="button" onClick={retry}>Thử lại</button>}</div>
}
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
export const discussionDate = (value: string) => dateFormatter.format(new Date(value))
export function DiscussionPagination({ page, totalPages, busy, onChange, label = 'Trang câu hỏi' }: { page: number; totalPages: number; busy: boolean; onChange: (page: number) => void; label?: string }) {
 if (totalPages <= 1 && page === 0) return null
 const visiblePages = [...new Set([0, page - 1, page, page + 1, totalPages - 1])].filter(value => value >= 0 && value < totalPages).sort((a, b) => a - b)
 return <nav className="discussion-pagination" aria-label={label}>
  <button className="discussion-button discussion-button-secondary" type="button" disabled={page === 0 || busy} onClick={() => onChange(page - 1)}><DiscussionIcon name="arrowLeft" />Trước</button>
    <div className="discussion-page-numbers">{visiblePages.map((value, index) => <span className="discussion-page-item" key={value}>
   {index > 0 && value - visiblePages[index - 1] > 1 && <span className="discussion-page-gap" aria-hidden="true">…</span>}
   <button type="button" className="discussion-page-number" aria-label={`Trang ${value + 1}`} aria-current={value === page ? 'page' : undefined} disabled={busy} onClick={() => onChange(value)}>{value + 1}</button>
  </span>)}</div>
  <button className="discussion-button discussion-button-secondary" type="button" disabled={page + 1 >= totalPages || busy} onClick={() => onChange(page + 1)}>Sau<DiscussionIcon name="arrowRight" /></button>
 </nav>
}
