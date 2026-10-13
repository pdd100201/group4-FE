import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { useBlogComments, useCommentActions, useCommentDetail } from '../../../shared/hooks/useBlogComments'
import type { BlogComment } from '../api/blogApi'
import { postDate } from './PostCard'

function errorMessage(error: unknown) {
  return isAxiosError<{ message?: string }>(error) ? error.response?.data.message || 'Không thể lưu thay đổi. Vui lòng thử lại.' : 'Không thể lưu thay đổi.'
}
function CommentItem({ comment, onDetail, onEdit, onDelete, pending }: {
  comment: BlogComment; onDetail: () => void; onEdit: (content: string) => Promise<boolean>; onDelete: () => void; pending: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)
  return <article className="blog-comment">
    {comment.avatarUrl ? <img src={comment.avatarUrl} alt="" className="comment-avatar" /> : <span className="comment-avatar" aria-hidden="true">{comment.authorName[0]}</span>}
    <div><b>{comment.authorName}</b> <small>{postDate(comment.createdAt)}{comment.updatedAt && comment.createdAt && comment.updatedAt !== comment.createdAt ? ' · Đã chỉnh sửa' : ''}</small>
      {editing ? <form onSubmit={async event => { event.preventDefault(); if (await onEdit(draft.trim())) setEditing(false) }}>
        <textarea aria-label="Sửa bình luận" maxLength={2000} required value={draft} onChange={event => setDraft(event.target.value)} />
        <button className="primary-button" disabled={pending || !draft.trim()}>Lưu</button> <button type="button" disabled={pending} onClick={() => setEditing(false)}>Hủy</button>
      </form> : <p className="comment-content">{comment.content}</p>}
      <div className="comment-actions"><button onClick={onDetail}>Xem chi tiết</button>
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
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const comments = useBlogComments(postId, page)
  const detail = useCommentDetail(postId, selected)
  const actions = useCommentActions(postId)
  const pending = actions.create.isPending || actions.edit.isPending || actions.remove.isPending
  return <section className="blog-comments" aria-label="Bình luận"><h2>Bình luận {comments.data ? `(${comments.data.totalElements})` : ''}</h2>
    {user?.roles.includes('ROLE_STUDENT') ? <form onSubmit={async event => {
      event.preventDefault(); setFeedback(''); setError('')
      try { await actions.create.mutateAsync(draft.trim()); setDraft(''); setFeedback('Đã gửi bình luận.'); setPage(0) }
      catch (cause) { setError(errorMessage(cause)) }
    }}><label htmlFor="new-comment">Chia sẻ ý kiến của bạn</label><textarea id="new-comment" maxLength={2000} required value={draft} onChange={event => setDraft(event.target.value)} />
      <small>{draft.length}/2000 ký tự</small><button className="primary-button" disabled={pending || !draft.trim()}>Gửi bình luận</button>
    </form> : !user && <p><Link to="/login" state={{ from: `/blog/${postId}` }}>Đăng nhập</Link> bằng tài khoản học viên để bình luận.</p>}
    {feedback && <p role="status">{feedback}</p>}{error && <p role="alert">{error}</p>}
    {comments.isPending && <p role="status">Đang tải bình luận…</p>}
    {comments.isError && <p role="alert">Không tải được bình luận. <button onClick={() => void comments.refetch()}>Thử lại</button></p>}
    {comments.data?.content.length === 0 && <p>Chưa có bình luận trên trang này.</p>}
    {comments.data?.content.map(comment => <CommentItem key={comment.id} comment={{ ...comment,
      canEdit: comment.canEdit && Boolean(user?.roles.includes('ROLE_STUDENT')),
      canDelete: comment.canDelete && Boolean(user?.roles.some(role => ['ROLE_STUDENT', 'ROLE_MANAGER', 'ROLE_ADMIN'].includes(role))),
    }} pending={pending} onDetail={() => setSelected(comment.id)} onEdit={async content => {
      setFeedback(''); setError('')
      try { await actions.edit.mutateAsync({ id: comment.id, content }); setFeedback('Đã cập nhật bình luận.'); return true }
      catch (cause) { setError(errorMessage(cause)); return false }
    }} onDelete={async () => {
      if (!window.confirm('Bạn có muốn xóa bình luận này?')) return
      setFeedback(''); setError('')
      try { await actions.remove.mutateAsync(comment.id); if (selected === comment.id) setSelected(null); setFeedback('Đã xóa bình luận.'); if (comments.data?.content.length === 1 && page > 0) setPage(page - 1) }
      catch (cause) { setError(errorMessage(cause)) }
    }} />)}
    {comments.data && comments.data.totalPages > 1 && <nav className="blog-pagination" aria-label="Phân trang bình luận">
      <button disabled={page === 0} onClick={() => { setPage(page - 1); setSelected(null) }}>Trước</button><span>Trang {page + 1} / {comments.data.totalPages}</span>
      <button disabled={page >= comments.data.totalPages - 1} onClick={() => { setPage(page + 1); setSelected(null) }}>Sau</button>
    </nav>}
    {selected !== null && <aside className="comment-detail"><h3>Chi tiết bình luận</h3><button onClick={() => setSelected(null)}>Đóng</button>
      {detail.isPending && <p role="status">Đang tải…</p>}
      {detail.isError && <p role="alert">Bình luận không còn khả dụng hoặc không tải được. <button onClick={() => void detail.refetch()}>Thử lại</button></p>}
      {detail.data && <><p>Bài viết: {detail.data.postTitle}</p><b>{detail.data.authorName}</b><p className="comment-content">{detail.data.content}</p><small>{postDate(detail.data.createdAt)} · Đang hiển thị</small></>}
    </aside>}
  </section>
}
