import { useState, type ComponentProps } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { useBlogComments, useCommentActions, useBlogReplies } from '../../../shared/hooks/useBlogComments'
import type { BlogComment } from '../api/blogApi'
import { postDate } from './PostCard'
import './comment-likes.css'

const commentRoles = ['ROLE_STUDENT', 'ROLE_EXPERT', 'ROLE_MANAGER', 'ROLE_ADMIN']
const emptyCommentMessage = 'Không lưu bình luận trống'

function errorMessage(error: unknown) {
  return isAxiosError<{ message?: string }>(error) ? error.response?.data.message || 'Không thể lưu thay đổi. Vui lòng thử lại.' : 'Không thể lưu thay đổi.'
}
function CommentItem({ comment, onLike, likePending, onReply, onEdit, onDelete, pending }: {
  comment: BlogComment; onLike: () => void; likePending: boolean; onReply?: () => void; onEdit: (content: string) => Promise<boolean>; onDelete: () => void; pending: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)
  const [validationAttempted, setValidationAttempted] = useState(false)
  const empty = validationAttempted && !draft.trim()
  return <article className="showcase-comment">
    {comment.avatarUrl ? <img src={comment.avatarUrl} alt="" className="showcase-comment-avatar" /> : <span className="showcase-comment-avatar" aria-hidden="true">{comment.authorName[0]}</span>}
    <div><div className="blog-comment-bubble"><b>{comment.authorName}</b> <small>{postDate(comment.createdAt)}{comment.updatedAt && comment.createdAt && comment.updatedAt !== comment.createdAt ? ' · Đã chỉnh sửa' : ''}</small>
      {editing ? <form noValidate onSubmit={async event => {
        event.preventDefault()
        if (pending) return
        setValidationAttempted(true)
        if (!draft.trim()) return
        if (await onEdit(draft.trim())) { setEditing(false); setValidationAttempted(false) }
      }}>
        <textarea aria-label="Sửa bình luận" aria-invalid={empty} aria-describedby={empty ? `comment-edit-error-${comment.id}` : undefined} maxLength={2000} required value={draft} onChange={event => setDraft(event.target.value)} />
        {empty && <p id={`comment-edit-error-${comment.id}`} className="blog-comment-validation" role="alert">{emptyCommentMessage}</p>}
        <button className="primary-button" disabled={pending}>Lưu</button> <button type="button" disabled={pending} onClick={() => { setEditing(false); setValidationAttempted(false) }}>Hủy</button>
      </form> : <p className="comment-content">{comment.content}</p>}
      </div><div className="showcase-comment-actions"><button type="button" className="blog-comment-like" aria-pressed={comment.liked} aria-label={`${comment.liked ? 'Bỏ thích' : 'Thích'} bình luận (${comment.likeCount} lượt thích)`} disabled={!comment.canLike || likePending || pending} title={comment.canLike ? undefined : 'Đăng nhập để thích bình luận'} onClick={onLike}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 10v11H3V10h4Zm0 0 5-8a3 3 0 0 1 2 4l-1 4h6a2 2 0 0 1 2 2l-2 7a3 3 0 0 1-3 2H7" /></svg><span>{comment.liked ? 'Đã thích' : 'Thích'}</span><span>{comment.likeCount}</span></button>
        {onReply && <button type="button" disabled={pending} onClick={onReply}>Phản hồi</button>}
        {comment.canEdit && !editing && <button disabled={pending} onClick={() => { setDraft(comment.content); setEditing(true) }}>Sửa</button>}
        {comment.canDelete && <button disabled={pending} onClick={onDelete}>Xóa</button>}
      </div>
    </div>
  </article>
}


function CommentThread(props: ComponentProps<typeof CommentItem> & { postId: number }) {
  const { user } = useAuth()
  const canReply = Boolean(user?.roles.some(role => commentRoles.includes(role)))
  const [open, setOpen] = useState(false)
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState('')
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [validationAttempted, setValidationAttempted] = useState(false)
  const empty = validationAttempted && !draft.trim()
  const replies = useBlogReplies(props.postId, props.comment.id, page, open)
  const actions = useCommentActions(props.postId)
  const busy = actions.reply.isPending || actions.edit.isPending || actions.remove.isPending || actions.like.isPending
  return <div className="blog-comment-thread"><CommentItem {...props} onReply={canReply ? () => { setOpen(true); setComposing(true) } : undefined} />
    {(props.comment.replyCount > 0 || open) && <button type="button" className="blog-replies-toggle" aria-expanded={open} onClick={() => setOpen(value => !value)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={open ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} /></svg><span>{open ? 'Ẩn phản hồi' : `Xem ${props.comment.replyCount} phản hồi`}</span></button>}
    {open && <div className="blog-comment-replies">

      {error && <p role="alert">{error}</p>}
      {replies.isPending ? <p role="status">Đang tải phản hồi…</p> : replies.isError ? <p role="alert">Không tải được phản hồi. <button onClick={() => void replies.refetch()}>Thử lại</button></p> : replies.data?.content.map(reply => <CommentItem key={reply.id} comment={reply} pending={busy} likePending={actions.like.isPending} onLike={() => actions.like.mutate({ id: reply.id, liked: !reply.liked }, { onError: cause => setError(errorMessage(cause)) })} onEdit={async content => {
        setError(''); try { await actions.edit.mutateAsync({ id: reply.id, content }); return true } catch (cause) { setError(errorMessage(cause)); return false }
      }} onDelete={async () => {
        if (!window.confirm('Bạn có muốn xóa phản hồi này?')) return
        setError(''); try { await actions.remove.mutateAsync(reply.id); if (replies.data?.content.length === 1 && page > 0) setPage(page - 1) } catch (cause) { setError(errorMessage(cause)) }
      }} />)}
      {composing && canReply && <form className="blog-reply-composer" noValidate onSubmit={async event => {
        event.preventDefault(); setError('')
        if (actions.reply.isPending) return
        setValidationAttempted(true)
        if (!draft.trim()) return
        try { await actions.reply.mutateAsync({ id: props.comment.id, content: draft.trim() }); setValidationAttempted(false); setDraft(''); setComposing(false); setPage(Math.floor((replies.data?.totalElements ?? 0) / 10)) }
        catch (cause) { setError(errorMessage(cause)) }
      }}><label><span className="blog-reply-label">Phản hồi {props.comment.authorName}</span><textarea autoFocus required aria-invalid={empty} aria-describedby={empty ? `comment-reply-error-${props.comment.id}` : undefined} maxLength={2000} rows={2} value={draft} onChange={event => setDraft(event.target.value)} placeholder={`Phản hồi ${props.comment.authorName}…`} disabled={actions.reply.isPending} /></label>
        {empty && <p id={`comment-reply-error-${props.comment.id}`} className="blog-comment-validation" role="alert">{emptyCommentMessage}</p>}
        <div><small>{draft.length}/2000 ký tự</small><button type="button" disabled={actions.reply.isPending} onClick={() => { setComposing(false); setError(''); setValidationAttempted(false) }}>Hủy</button><button type="submit" className="course-primary" disabled={actions.reply.isPending}>{actions.reply.isPending ? 'Đang gửi…' : 'Gửi phản hồi'}</button></div></form>}
      {canReply && !composing && <button type="button" className="blog-reply-placeholder" onClick={() => setComposing(true)}>{user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span className="blog-reply-avatar" aria-hidden="true">{user?.fullName?.[0] ?? 'U'}</span>}<span>Phản hồi {props.comment.authorName}…</span></button>}
      {replies.data && replies.data.totalPages > 1 && <nav className="blog-replies-pagination" aria-label="Phân trang phản hồi"><button disabled={page === 0 || replies.isFetching} onClick={() => setPage(value => value - 1)}>Trước</button><span>Trang {page + 1} / {replies.data.totalPages}</span><button disabled={page + 1 >= replies.data.totalPages || replies.isFetching} onClick={() => setPage(value => value + 1)}>Sau</button></nav>}
    </div>}
  </div>
}

export function CommentSection({ postId }: { postId: number }) {
  const { user } = useAuth()
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [validationAttempted, setValidationAttempted] = useState(false)
  const empty = validationAttempted && !draft.trim()
  const comments = useBlogComments(postId, page)
  const actions = useCommentActions(postId)
  const canComment = Boolean(user?.roles.some(role => commentRoles.includes(role)))
  const pending = actions.create.isPending || actions.edit.isPending || actions.remove.isPending
  return <section className="showcase-comments" aria-label="Bình luận"><h3>Bình luận <span>({comments.data?.totalElements ?? 0} phản hồi)</span></h3>
    {canComment ? <form noValidate onSubmit={async event => {
      event.preventDefault(); setFeedback(''); setError('')
      if (pending) return
      setValidationAttempted(true)
      if (!draft.trim()) return
      try { await actions.create.mutateAsync(draft.trim()); setValidationAttempted(false); setDraft(''); setFeedback('Đã gửi bình luận.'); setPage(0) }
      catch (cause) { setError(errorMessage(cause)) }
    }} className="showcase-comment-composer showcase-real-comment-composer"><textarea aria-label="Chia sẻ ý kiến của bạn" aria-invalid={empty} aria-describedby={empty ? `comment-create-error-${postId}` : undefined} placeholder="Chia sẻ suy nghĩ hoặc câu hỏi của bạn về bài viết này…" maxLength={2000} required value={draft} onChange={event => setDraft(event.target.value)} />
      {empty && <p id={`comment-create-error-${postId}`} className="blog-comment-validation" role="alert">{emptyCommentMessage}</p>}
      <small>{draft.length}/2000 ký tự</small><button disabled={pending}>Gửi bình luận <span aria-hidden="true">➤</span></button>
    </form> : !user && <p className="showcase-comment-login-note"><Link to="/login" state={{ from: `/blog/${postId}` }}>Đăng nhập</Link> để gửi bình luận. Bạn vẫn có thể đọc các bình luận công khai bên dưới.</p>}
    {feedback && <p role="status">{feedback}</p>}{error && <p role="alert">{error}</p>}
    {comments.isPending && <p role="status">Đang tải bình luận…</p>}
    {comments.isError && <p role="alert">Không tải được bình luận. <button onClick={() => void comments.refetch()}>Thử lại</button></p>}
    {comments.data?.content.length === 0 && <p>Chưa có bình luận trên trang này.</p>}
    <div className="showcase-comment-list" aria-label="Danh sách bình luận công khai">{comments.data?.content.map(comment => <CommentThread key={comment.id} postId={postId} comment={{ ...comment,
      canEdit: comment.canEdit && Boolean(user?.roles.some(role => commentRoles.includes(role))),
      canDelete: comment.canDelete && Boolean(user?.roles.some(role => commentRoles.includes(role))),
    }} pending={pending} likePending={actions.like.isPending && actions.like.variables?.id === comment.id} onLike={() => {
      setError('')
      actions.like.mutate({ id: comment.id, liked: !comment.liked }, { onError: cause => setError(errorMessage(cause)) })
    }} onEdit={async content => {
      setFeedback(''); setError('')
      try { await actions.edit.mutateAsync({ id: comment.id, content }); setFeedback('Đã cập nhật bình luận.'); return true }
      catch (cause) { setError(errorMessage(cause)); return false }
    }} onDelete={async () => {
      if (!window.confirm('Bạn có muốn xóa bình luận này?')) return
      setFeedback(''); setError('')
      try { await actions.remove.mutateAsync(comment.id); setFeedback('Đã xóa bình luận.'); if (comments.data?.content.length === 1 && page > 0) setPage(page - 1) }
      catch (cause) { setError(errorMessage(cause)) }
    }} />)}</div>
    {comments.data && comments.data.totalPages > 1 && <nav className="blog-pagination" aria-label="Phân trang bình luận">
      <button disabled={page === 0} onClick={() => setPage(page - 1)}>Trước</button><span>Trang {page + 1} / {comments.data.totalPages}</span>
      <button disabled={page >= comments.data.totalPages - 1} onClick={() => setPage(page + 1)}>Sau</button>
    </nav>}

  </section>
}
