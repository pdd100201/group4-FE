import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { useBlogComments, useCommentActions } from '../../../shared/hooks/useBlogComments'
import type { BlogComment } from '../api/blogApi'
import { postDate } from './PostCard'

function errorMessage(error: unknown) {
  return isAxiosError<{ message?: string }>(error) ? error.response?.data.message || 'Không thể lưu thay đổi. Vui lòng thử lại.' : 'Không thể lưu thay đổi.'
}
function CommentItem({ comment, onEdit, onDelete, pending }: {
  comment: BlogComment; onEdit: (content: string) => Promise<boolean>; onDelete: () => void; pending: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)
  return <article className="showcase-comment">
    {comment.avatarUrl ? <img src={comment.avatarUrl} alt="" className="showcase-comment-avatar" /> : <span className="showcase-comment-avatar" aria-hidden="true">{comment.authorName[0]}</span>}
    <div><b>{comment.authorName}</b> <small>{postDate(comment.createdAt)}{comment.updatedAt && comment.createdAt && comment.updatedAt !== comment.createdAt ? ' · Đã chỉnh sửa' : ''}</small>
      {editing ? <form onSubmit={async event => { event.preventDefault(); if (await onEdit(draft.trim())) setEditing(false) }}>
        <textarea aria-label="Sửa bình luận" maxLength={2000} required value={draft} onChange={event => setDraft(event.target.value)} />
        <button className="primary-button" disabled={pending || !draft.trim()}>Lưu</button> <button type="button" disabled={pending} onClick={() => setEditing(false)}>Hủy</button>
      </form> : <p className="comment-content">{comment.content}</p>}
      <div className="showcase-comment-actions">
        {comment.canEdit && !editing && <button disabled={pending} onClick={() => { setDraft(comment.content); setEditing(true) }}>Sửa</button>}
        {comment.canDelete && <button disabled={pending} onClick={onDelete}>Xóa</button>}
      </div>
    </div>
  </article>
}

export function CommentSection({ postId }: { postId: number }) {
  const { user } = useAuth()
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const comments = useBlogComments(postId, page)
  const actions = useCommentActions(postId)
  const commentRole = user?.roles.includes('ROLE_STUDENT') ? 'student'
    : user?.roles.includes('ROLE_EXPERT') ? 'expert'
      : user?.roles.includes('ROLE_MANAGER') ? 'manager'
        : user?.roles.includes('ROLE_ADMIN') ? 'admin' : null
  const canComment = commentRole !== null
  const pending = actions.create.isPending || actions.edit.isPending || actions.remove.isPending
  return <section className="showcase-comments" aria-label="Bình luận"><h3>Bình luận &amp; Thảo luận</h3>
    {canComment ? <form onSubmit={async event => {
      event.preventDefault(); setFeedback(''); setError('')
      if (!commentRole) return
      try { await actions.create.mutateAsync({ content: draft.trim(), role: commentRole }); setDraft(''); setFeedback('Đã gửi bình luận.'); setPage(0) }
      catch (cause) { setError(errorMessage(cause)) }
    }} className="showcase-comment-composer showcase-real-comment-composer"><textarea aria-label="Chia sẻ ý kiến của bạn" placeholder="Chia sẻ suy nghĩ hoặc câu hỏi của bạn về bài viết này…" maxLength={2000} required value={draft} onChange={event => setDraft(event.target.value)} />
      <small>{draft.length}/2000 ký tự</small><button disabled={pending || !draft.trim()}>Gửi bình luận <span aria-hidden="true">➤</span></button>
    </form> : !user && <p className="showcase-comment-login-note"><Link to="/login" state={{ from: `/blog/${postId}` }}>Đăng nhập</Link> bằng tài khoản học viên, chuyên gia, quản lý hoặc quản trị viên để gửi bình luận. Bạn vẫn có thể đọc các bình luận công khai bên dưới.</p>}
    {feedback && <p role="status">{feedback}</p>}{error && <p role="alert">{error}</p>}
    {comments.isPending && <p role="status">Đang tải bình luận…</p>}
    {comments.isError && <p role="alert">Không tải được bình luận. <button onClick={() => void comments.refetch()}>Thử lại</button></p>}
    {comments.data?.content.length === 0 && <p>Chưa có bình luận trên trang này.</p>}
    <div className="showcase-comment-list" aria-label="Danh sách bình luận công khai">{comments.data?.content.map(comment => <CommentItem key={comment.id} comment={{ ...comment,
      canEdit: comment.canEdit && Boolean(commentRole),
      canDelete: comment.canDelete && Boolean(user?.roles.some(role => ['ROLE_STUDENT', 'ROLE_EXPERT', 'ROLE_MANAGER', 'ROLE_ADMIN'].includes(role))),
    }} pending={pending} onEdit={async content => {
      setFeedback(''); setError('')
      if (!commentRole) return false
      try { await actions.edit.mutateAsync({ id: comment.id, content, role: commentRole }); setFeedback('Đã cập nhật bình luận.'); return true }
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
