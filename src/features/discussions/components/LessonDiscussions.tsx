import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { discussionApi } from '../api/discussionApi'
import { useAuth } from '../../../shared/context/AuthContext'
import { DiscussionThread } from './DiscussionThread'
import { DiscussionAvatar, DiscussionError, DiscussionIcon, DiscussionPagination, DiscussionStatus, discussionDate } from './DiscussionPrimitives'
import './discussions.css'

const filters = [
 { value: 'all', label: 'Tất cả' },
 { value: 'unanswered', label: 'Chờ trả lời' },
 { value: 'open', label: 'Chưa giải quyết' },
 { value: 'resolved', label: 'Đã giải quyết' },
]
export function LessonDiscussions({ lessonId }: { lessonId?: number }) {
 const { user } = useAuth()
 const location = useLocation()
 const [params, setParams] = useSearchParams()
 const search = (params.get('qaSearch') ?? '').slice(0, 100)
 const state = filters.some(f => f.value === params.get('qaState')) ? params.get('qaState')! : 'all'
 const pageValue = Number(params.get('qaPage') ?? 1)
 const page = Number.isSafeInteger(pageValue) && pageValue > 0 && pageValue <= 100001 ? pageValue - 1 : 0
 const selectedValue = params.get('qaQuestion')
 const selectedId = selectedValue !== null && /^[1-9]\d*$/.test(selectedValue) && Number.isSafeInteger(Number(selectedValue)) ? Number(selectedValue) : null
 const [searchInput, setSearchInput] = useState(search)
 useEffect(() => { setSearchInput(search) }, [search])
 const embedded = lessonId !== undefined
 const expert = user?.roles.includes('ROLE_EXPERT')
 const list = useQuery({ queryKey: ['lesson-discussions', user?.id, lessonId, search, state, page],
  queryFn: () => discussionApi.list(lessonId, search, state, page), enabled: selectedValue === null, retry: false })
 function updateList(values: { search?: string; state?: string; page?: number }) {
  const next = new URLSearchParams(params)
  next.delete('qaQuestion')
  if (values.search !== undefined) { if (values.search) next.set('qaSearch', values.search); else next.delete('qaSearch') }
  if (values.state !== undefined) { if (values.state !== 'all') next.set('qaState', values.state); else next.delete('qaState') }
  const targetPage = values.page ?? 0
  if (targetPage > 0) next.set('qaPage', String(targetPage + 1)); else next.delete('qaPage')
  setParams(next)
 }
 function clearFilters() { setSearchInput(''); updateList({ search: '', state: 'all', page: 0 }) }
 function returnToList() { const next = new URLSearchParams(params); next.delete('qaQuestion'); setParams(next) }
 function detailLink(id: number) {
  const next = new URLSearchParams(params); next.set('qaQuestion', String(id))
  return { pathname: location.pathname, search: '?' + next.toString() }
 }
 const filtered = !!search || state !== 'all'
 const title = embedded ? 'Hỏi đáp bài học' : 'Hỏi đáp học viên'
 const description = embedded ? 'Gửi thắc mắc về bài học. Chọn một câu hỏi để xem giải đáp từ giảng viên.'
  : expert ? 'Chọn câu hỏi của học viên để xem nội dung và gửi giải đáp.'
  : 'Tìm và chọn câu hỏi để xem nội dung, phản hồi hoặc kiểm duyệt.'
 if (selectedValue !== null) return <section className={`lesson-discussions ${embedded ? 'discussion-embedded' : 'discussion-workspace'}`} aria-label="Chi tiết câu hỏi">
  <button type="button" className="discussion-text-button discussion-back-link" onClick={returnToList}><DiscussionIcon name="arrowLeft" />Quay lại danh sách câu hỏi</button>
  <header className="discussion-page-heading"><div className="discussion-heading-copy">
   <span className="discussion-eyebrow"><DiscussionIcon name="message" />HỎI ĐÁP BÀI HỌC</span>
   {embedded ? <h2>Chi tiết câu hỏi</h2> : <h1>Chi tiết câu hỏi</h1>}
   <p>Xem câu hỏi và các giải đáp từ giảng viên phụ trách.</p>
  </div></header>
  {selectedId === null ? <div className="discussion-error" role="alert">Mã câu hỏi không hợp lệ. Vui lòng quay lại danh sách.</div>
   : <DiscussionThread key={selectedId} id={selectedId} lessonId={lessonId} />}
 </section>
 return <section className={`lesson-discussions ${embedded ? 'discussion-embedded' : 'discussion-workspace'}`} aria-label={title}>
  <header className="discussion-page-heading">
   <div className="discussion-heading-copy">
    <span className="discussion-eyebrow"><DiscussionIcon name="message" />HỖ TRỢ HỌC TẬP</span>
    {embedded ? <h2>{title}</h2> : <h1>{title}</h1>}<p>{description}</p>
   </div>
   {!embedded && <span className="discussion-scope"><DiscussionIcon name="book" />{expert ? 'Khóa học bạn phụ trách' : 'Kiểm duyệt nội dung'}</span>}
  </header>
  {embedded && user?.roles.includes('ROLE_STUDENT') && <AskQuestionForm key={lessonId} lessonId={lessonId} onCreated={clearFilters} />}
  <section className="discussion-toolbar" aria-label="Tìm và lọc câu hỏi">
   <form className="discussion-search" role="search" onSubmit={e => { e.preventDefault(); updateList({ search: searchInput.trim() }) }}>
    <label className="discussion-search-field"><DiscussionIcon name="search" /><span className="discussion-sr-only">Tìm câu hỏi theo tiêu đề hoặc nội dung</span>
     <input type="search" maxLength={100} value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Tìm câu hỏi theo tiêu đề hoặc nội dung…" />
    </label><button className="discussion-button discussion-button-primary" type="submit">Tìm kiếm</button>
   </form>
   <div className="discussion-toolbar-bottom">
    <div className="discussion-filter-tabs" role="group" aria-label="Lọc theo trạng thái">{filters.map(filter =>
     <button type="button" key={filter.value} aria-pressed={state === filter.value} onClick={() => updateList({ state: filter.value })}>{filter.label}</button>)}</div>
    {filtered && <button className="discussion-text-button" type="button" onClick={clearFilters}><DiscussionIcon name="close" />Xóa bộ lọc</button>}
   </div>
  </section>
  <div className="discussion-results-heading">
   <p role="status" aria-live="polite">{list.isSuccess ? <><strong>{list.data.totalElements}</strong> câu hỏi{search && <span> cho “{search}”</span>}</> : 'Danh sách câu hỏi'}</p>
   <button className="discussion-text-button" type="button" disabled={list.isFetching} onClick={() => void list.refetch()}><DiscussionIcon name="refresh" className={list.isFetching ? 'discussion-spinning' : ''} />{list.isFetching ? 'Đang tải' : 'Làm mới'}</button>
  </div>
  {list.isPending && <div className="discussion-loading" role="status"><span className="discussion-skeleton discussion-skeleton-title" /><span className="discussion-skeleton" /><span className="discussion-skeleton discussion-skeleton-short" /><span className="discussion-sr-only">Đang tải câu hỏi…</span></div>}
  {list.isError && <DiscussionError error={list.error} retry={() => void list.refetch()} />}
  {list.isSuccess && <>
   {list.data.content.length > 0 ? <div className="discussion-question-list">{list.data.content.map(question =>
    <Link className="discussion-question-row" key={question.id} to={detailLink(question.id)} aria-label={`Xem câu hỏi: ${question.title}`}>
     <DiscussionAvatar name={question.authorName} />
     <div className="discussion-row-content"><div className="discussion-row-title"><h3>{question.title}</h3></div>
      <p className="discussion-row-preview">{question.content}</p>
      <div className="discussion-row-context"><DiscussionIcon name="book" /><span>{question.courseTitle}</span><span aria-hidden="true">/</span><span>{question.lessonTitle}</span></div>
      <div className="discussion-row-meta"><span>{question.authorName}</span><span aria-hidden="true">·</span><time dateTime={question.createdAt}>{discussionDate(question.createdAt)}</time></div>
     </div>
     <div className="discussion-row-actions"><DiscussionStatus question={question} /><span className="discussion-row-open"><span>Xem chi tiết</span><DiscussionIcon name="arrowRight" /></span></div>
    </Link>)}</div>
    : <div className="discussion-empty"><span className="discussion-empty-icon"><DiscussionIcon name={filtered ? 'search' : 'message'} /></span>
     <h3>{filtered ? 'Không tìm thấy câu hỏi phù hợp' : 'Chưa có câu hỏi nào'}</h3>
     <p>{filtered ? 'Thử từ khóa khác hoặc xóa bộ lọc để xem thêm câu hỏi.' : embedded ? 'Bạn có thắc mắc về bài học? Gửi câu hỏi để giảng viên hỗ trợ.' : 'Các câu hỏi mới của học viên sẽ xuất hiện tại đây.'}</p>
     {filtered && <button className="discussion-button discussion-button-secondary" type="button" onClick={clearFilters}>Xem tất cả câu hỏi</button>}
    </div>}
   <DiscussionPagination page={page} totalPages={list.data.totalPages} busy={list.isFetching} onChange={value => updateList({ page: value })} />
  </>}
 </section>
}


function AskQuestionForm({ lessonId, onCreated }: { lessonId: number; onCreated: () => void }) {
 const { user } = useAuth()
 const client = useQueryClient()
 const id = useId()
 const [title, setTitle] = useState('')
 const [content, setContent] = useState('')
 const [sent, setSent] = useState(false)
 const create = useMutation({
  mutationFn: () => discussionApi.create(lessonId, title.trim(), content.trim()),
  onSuccess: async () => {
   setTitle(''); setContent(''); setSent(true); onCreated()
   await client.invalidateQueries({ queryKey: ['lesson-discussions', user?.id] })
  },
 })
 function submit(event: FormEvent) {
  event.preventDefault()
  if (!create.isPending && title.trim() && content.trim()) { setSent(false); create.mutate() }
 }
 return <form className="discussion-ask-form" onSubmit={submit}>
  <div className="discussion-form-heading"><h3>Đặt câu hỏi cho giảng viên</h3><p>Mô tả cụ thể vấn đề và những cách bạn đã thử để nhận được giải đáp hữu ích.</p></div>
  <label htmlFor={id + '-title'}>Tiêu đề câu hỏi <span aria-hidden="true">*</span></label>
  <input id={id + '-title'} required maxLength={200} value={title} disabled={create.isPending} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Khi nào nên sử dụng interface thay vì abstract class?" />
  <label htmlFor={id + '-body'}>Nội dung <span aria-hidden="true">*</span></label>
  <textarea id={id + '-body'} required rows={4} maxLength={4000} value={content} disabled={create.isPending} onChange={e => setContent(e.target.value)} placeholder="Nêu câu hỏi, ví dụ hoặc phần kiến thức bạn chưa rõ…" aria-describedby={id + '-hint'} />
  <div className="discussion-compose-footer"><span id={id + '-hint'} className="discussion-input-hint">{content.length.toLocaleString('vi-VN')} / 4.000 ký tự</span>
   <button className="discussion-button discussion-button-primary" disabled={create.isPending || !title.trim() || !content.trim()}><DiscussionIcon name="send" />{create.isPending ? 'Đang gửi…' : 'Gửi câu hỏi'}</button></div>
  {sent && <p className="discussion-success" role="status"><DiscussionIcon name="check" />Đã gửi câu hỏi. Giảng viên sẽ nhận được thông báo.</p>}
  {create.isError && <DiscussionError error={create.error} />}
 </form>
}
