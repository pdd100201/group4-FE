import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { discussionApi } from '../api/discussionApi'
import { useAuth } from '../../../shared/context/AuthContext'
import { DiscussionAvatar, DiscussionError, DiscussionIcon, DiscussionPagination, DiscussionStatus, discussionDate } from './DiscussionPrimitives'

type Action = { type: 'reply' } | { type: 'resolve'; answerId: number | null } | { type: 'hide'; hidden: boolean; answerId?: number }
export function DiscussionThread({ id, lessonId }: { id: number; lessonId?: number }) {
 const { user } = useAuth()
 const client = useQueryClient()
 const [page, setPage] = useState(0)
 const [draft, setDraft] = useState('')
 const [feedback, setFeedback] = useState('')
 const fieldId = useId()
 const textarea = useRef<HTMLTextAreaElement>(null)
 const query = useQuery({ queryKey: ['lesson-discussion', user?.id, id, page], queryFn: () => discussionApi.detail(id, page), retry: false })
 const action = useMutation({
  mutationFn: async (value: Action) => {
   if (value.type === 'reply') return discussionApi.reply(id, draft.trim())
   if (value.type === 'resolve') return discussionApi.resolve(id, value.answerId)
   return discussionApi.visibility(id, value.hidden, value.answerId)
  },
  onSuccess: async (_, value) => {
   if (value.type === 'reply') { setDraft(''); setPage(0); setFeedback('Đã gửi giải đáp đến học viên.') }
   else setFeedback(value.type === 'resolve' ? (value.answerId === null ? 'Đã mở lại câu hỏi.' : 'Đã đánh dấu câu trả lời giải quyết.') : value.hidden ? 'Đã ẩn nội dung.' : 'Đã khôi phục nội dung.')
   await Promise.all([
    client.invalidateQueries({ queryKey: ['lesson-discussion', user?.id, id] }),
    client.invalidateQueries({ queryKey: ['lesson-discussions', user?.id] }),
   ])
  },
 })
 useEffect(() => {
  if (action.isSuccess && !action.isPending && action.variables?.type === 'reply') textarea.current?.focus()
 }, [action.isSuccess, action.isPending, action.variables])
 const q = query.data?.question
 const canReply = q?.canReply && user?.roles.includes('ROLE_EXPERT')
 function submit(event: FormEvent) {
  event.preventDefault()
  if (canReply && draft.trim() && !action.isPending) { setFeedback(''); action.mutate({ type: 'reply' }) }
 }
 if (query.isError) return <DiscussionError error={query.error} retry={() => void query.refetch()} />
 if (!q) return <div className="discussion-loading" role="status">Đang tải câu hỏi…</div>
 if (lessonId !== undefined && q.lessonId !== lessonId) return <div className="discussion-error" role="alert">Câu hỏi không thuộc bài học hiện tại.</div>
 return <article className={`discussion-thread ${q.hidden ? 'discussion-thread-hidden' : ''}`} aria-labelledby={fieldId + '-title'}>
  <div className="discussion-question">
   <div className="discussion-thread-heading">
    <div className="discussion-author"><DiscussionAvatar name={q.authorName} /><div><b>{q.authorName}</b><span>Học viên <span aria-hidden="true">·</span> <time dateTime={q.createdAt}>{discussionDate(q.createdAt)}</time></span></div></div>
    <DiscussionStatus question={q} />
   </div>
   <div className="discussion-question-content">
    <div className="discussion-context"><DiscussionIcon name="book" /><span>{q.courseTitle}</span><span aria-hidden="true">/</span><span>{q.lessonTitle}</span></div>
    <h3 id={fieldId + '-title'}>{q.title}</h3><p className="discussion-body">{q.content}</p>
    {(q.canModerate || (q.canResolve && q.acceptedAnswerId !== null)) && <div className="discussion-controls">
     {q.canResolve && q.acceptedAnswerId !== null && <button className="discussion-text-button" type="button" disabled={action.isPending} onClick={() => action.mutate({ type: 'resolve', answerId: null })}><DiscussionIcon name="refresh" />Mở lại câu hỏi</button>}
     {q.canModerate && <button className="discussion-text-button" type="button" disabled={action.isPending} onClick={() => action.mutate({ type: 'hide', hidden: !q.hidden })}>{q.hidden ? 'Khôi phục câu hỏi' : 'Ẩn câu hỏi'}</button>}
    </div>}
   </div>
  </div>
  <section className="discussion-responses" aria-label="Giải đáp của giảng viên">
   {query.isPending && <p className="discussion-muted" role="status">Đang tải phản hồi…</p>}
   {query.isSuccess && <>
    {query.data.answers.totalElements > 0 && <h4 className="discussion-replies-heading">Giải đáp <span>{query.data.answers.totalElements}</span></h4>}
    {query.data.answers.content.map(answer => {
     const accepted = q.acceptedAnswerId === answer.id
     return <article className={`discussion-answer ${accepted ? 'discussion-answer-accepted' : ''}`} key={answer.id}>
      <div className="discussion-answer-heading">
       <div className="discussion-author"><DiscussionAvatar name={answer.authorName} expert={answer.expert} /><div><b>{answer.authorName} {answer.expert && <span className="discussion-expert-label">Giảng viên</span>}</b><time dateTime={answer.createdAt}>{discussionDate(answer.createdAt)}</time></div></div>
       {accepted && <span className="discussion-accepted-label"><DiscussionIcon name="check" />Đã giải quyết</span>}
       {answer.hidden && <span className="discussion-status discussion-status-hidden">Đã ẩn</span>}
      </div>
      <p className="discussion-body">{answer.content}</p>
      {((q.canResolve && !answer.hidden && !accepted) || q.canModerate) && <div className="discussion-controls">
       {q.canResolve && !answer.hidden && !accepted && <button className="discussion-text-button" type="button" disabled={action.isPending} onClick={() => action.mutate({ type: 'resolve', answerId: answer.id })}><DiscussionIcon name="check" />Đánh dấu đã giải quyết</button>}
       {q.canModerate && <button className="discussion-text-button" type="button" disabled={action.isPending} onClick={() => action.mutate({ type: 'hide', hidden: !answer.hidden, answerId: answer.id })}>{answer.hidden ? 'Khôi phục trả lời' : 'Ẩn trả lời'}</button>}
      </div>}
     </article>
    })}
    {!query.data.answers.totalElements && !canReply && <p className="discussion-awaiting"><DiscussionIcon name="message" />{q.hidden ? 'Nội dung đang được ẩn khỏi học viên.' : 'Đang chờ giảng viên giải đáp.'}</p>}
    <DiscussionPagination page={page} totalPages={query.data.answers.totalPages} busy={query.isFetching} onChange={setPage} label="Trang giải đáp" />
    {canReply && <form className="discussion-reply-form" onSubmit={submit} aria-busy={action.isPending}>
     <div className="discussion-reply-heading"><DiscussionIcon name="message" /><label htmlFor={fieldId + '-reply'}>{query.data.answers.totalElements ? 'Bổ sung giải đáp' : 'Giải đáp cho học viên'}</label></div>
     <textarea ref={textarea} id={fieldId + '-reply'} required rows={3} maxLength={4000} value={draft} disabled={action.isPending}
      aria-describedby={fieldId + '-hint'} placeholder="Viết giải thích rõ ràng, kèm ví dụ hoặc hướng dẫn để học viên hiểu bài…"
      onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (draft.trim() && !action.isPending) e.currentTarget.form?.requestSubmit() } }} />
     <div className="discussion-compose-footer"><span id={fieldId + '-hint'} className="discussion-input-hint"><span className="discussion-shortcut">Ctrl / ⌘ + Enter để gửi <span aria-hidden="true">·</span> </span>{draft.length.toLocaleString('vi-VN')} / 4.000</span>
      <button className="discussion-button discussion-button-primary" disabled={action.isPending || !draft.trim()}><DiscussionIcon name="send" />{action.isPending ? 'Đang gửi…' : 'Gửi giải đáp'}</button></div>
    </form>}
   </>}
  </section>
  {feedback && <p className="discussion-success discussion-thread-feedback" role="status"><DiscussionIcon name="check" />{feedback}</p>}
  {action.isError && <div className="discussion-thread-feedback"><DiscussionError error={action.error} /></div>}
 </article>
}
