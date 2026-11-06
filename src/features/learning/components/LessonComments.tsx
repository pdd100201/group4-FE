import { useEffect, useId, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../shared/context/AuthContext'
import { lessonCommentApi, type LessonComment } from '../api/lessonCommentApi'
import { discussionErrorText } from '../../discussions/components/DiscussionPrimitives'
import './lesson-comments.css'

const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

function CommentForm({ lessonId, parentId, editing, onSent, onCancel }: {
  lessonId: number; parentId?: number; editing?: LessonComment; onSent: () => void; onCancel?: () => void
}) {
  const [content, setContent] = useState(editing?.content ?? '')
  const id = useId()
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: (text: string) => editing ? lessonCommentApi.update(lessonId, editing.id, text) : lessonCommentApi.create(lessonId, text, parentId),
    onSuccess: async () => {
      setContent(''); onSent()
      await client.invalidateQueries({ queryKey: ['lesson-comments'] })
    },
  })
  function submit(event: FormEvent) { event.preventDefault(); if (content.trim()) mutation.mutate(content.trim()) }
  return <form className="lesson-comment-form" onSubmit={submit}>
    <label htmlFor={id}>{editing ? 'Chỉnh sửa bình luận' : parentId ? 'Viết trả lời' : 'Chia sẻ cùng các học viên'}</label>
    <textarea id={id} maxLength={2000} rows={3} placeholder={parentId ? 'Nhập trả lời của bạn…' : 'Bạn nghĩ gì về bài học này?'} value={content} onChange={e => setContent(e.target.value)} disabled={mutation.isPending} required />
    <div className="lesson-comment-form-actions"><small>{content.length}/2.000 ký tự</small>
      {onCancel && <button type="button" onClick={onCancel} disabled={mutation.isPending}>Hủy</button>}
      <button className="lesson-comment-primary" type="submit" disabled={!content.trim() || mutation.isPending}>{mutation.isPending ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : parentId ? 'Gửi trả lời' : 'Gửi bình luận'}</button>
    </div>
    {mutation.isError && <p className="lesson-comment-error" role="alert">{discussionErrorText(mutation.error)}</p>}
  </form>
}

function Pagination({ page, pages, busy, change, label }: {
  page: number; pages: number; busy: boolean; change: (page: number) => void; label: string
}) {
  if (pages <= 1) return null
  return <nav className="lesson-comment-pagination" aria-label={label}>
    <button type="button" disabled={page === 0 || busy} onClick={() => change(page - 1)}>Trước</button>
    <span>Trang {page + 1}/{pages}</span>
    <button type="button" disabled={page + 1 >= pages || busy} onClick={() => change(page + 1)}>Sau</button>
  </nav>
}

function Replies({ comment }: { comment: LessonComment }) {
  const { user } = useAuth()
  const [page, setPage] = useState(0)
  const query = useQuery({ queryKey: ['lesson-comments', user?.id, comment.lessonId, 'replies', comment.id, page],
    queryFn: () => lessonCommentApi.list(comment.lessonId, page, comment.id), retry: false, refetchInterval: 30000 })
  useEffect(() => {
    if (query.data && page > 0 && page >= query.data.totalPages) setPage(Math.max(0, query.data.totalPages - 1))
  }, [query.data, page])
  return <div className="lesson-comment-replies">
    {query.isPending && <p role="status">Đang tải trả lời…</p>}
    {query.isError && <div role="alert"><p>{discussionErrorText(query.error)}</p><button type="button" onClick={() => void query.refetch()}>Thử lại</button></div>}
    {query.data && <>{query.data.content.map(reply => <Comment key={reply.id} comment={reply} />)}
      <Pagination page={page} pages={query.data.totalPages} busy={query.isFetching} change={setPage} label="Trang trả lời" />
    </>}
  </div>
}

function Comment({ comment }: { comment: LessonComment }) {
  const { user } = useAuth()
  const [replying, setReplying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const client = useQueryClient()
  const like = useMutation({
    mutationFn: () => lessonCommentApi.like(comment.lessonId, comment.id, !comment.likedByMe),
    onSuccess: () => client.invalidateQueries({ queryKey: ['lesson-comments'] }),
  })
  const remove = useMutation({
    mutationFn: () => lessonCommentApi.delete(comment.lessonId, comment.id),
    onSuccess: async () => {
      setConfirmDelete(false); setEditing(false); setReplying(false)
      await client.invalidateQueries({ queryKey: ['lesson-comments'] })
    },
  })
  const own = user?.id === comment.authorId && !comment.deleted
  const busy = like.isPending || remove.isPending
  if (comment.deleted) return null
  return <article className="lesson-comment">
    <div className="lesson-comment-avatar" aria-hidden="true">{comment.avatarUrl
      ? <img src={comment.avatarUrl} alt="" /> : (comment.authorName || 'H').slice(0, 1).toLocaleUpperCase('vi')}</div>
    <div className="lesson-comment-body"><header><b>{comment.authorName || 'Học viên'}</b><time dateTime={comment.createdAt}>{date.format(new Date(comment.createdAt))}</time>{comment.edited && !comment.deleted && <small className="lesson-comment-edited">Đã chỉnh sửa</small>}</header>
      {editing && !comment.deleted ? <CommentForm lessonId={comment.lessonId} editing={comment} onSent={() => setEditing(false)} onCancel={() => setEditing(false)} />
        : <p className={`lesson-comment-content ${comment.deleted ? 'lesson-comment-deleted' : ''}`}>{comment.content}</p>}
      <div className="lesson-comment-actions">
        {!comment.deleted && <button type="button" aria-pressed={comment.likedByMe} disabled={busy} onClick={() => like.mutate()}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M7 10v11H3V10h4Zm0 0 5-8c2 0 3 2 2 5l-1 3h6c2 0 2 2 2 3l-2 7H7" /></svg>
          {comment.likedByMe ? 'Đã thích' : 'Thích'}{comment.likeCount > 0 ? ` (${comment.likeCount})` : ''}
        </button>}
        {!comment.deleted && comment.parentId === null && <button type="button" disabled={busy} aria-expanded={replying} onClick={() => setReplying(value => !value)}>Trả lời</button>}
        {own && !editing && !confirmDelete && <><button type="button" disabled={busy} onClick={() => { setEditing(true); setReplying(false) }}>Sửa</button>
          <button className="lesson-comment-delete" type="button" disabled={busy} onClick={() => { setConfirmDelete(true); setReplying(false) }}>Xóa</button></>}
        {comment.parentId === null && comment.replyCount > 0 && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Ẩn' : 'Xem'} {comment.replyCount} trả lời</button>}
      </div>
      {confirmDelete && !comment.deleted && <div className="lesson-comment-delete-confirm" role="group" aria-label="Xác nhận xóa bình luận">
        <p>{comment.parentId === null ? 'Xóa bình luận này và toàn bộ trả lời bên dưới?' : 'Xóa trả lời này?'}</p>
        <button className="lesson-comment-delete" type="button" disabled={busy} onClick={() => remove.mutate()}>{remove.isPending ? 'Đang xóa…' : 'Xác nhận xóa'}</button>
        <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)}>Hủy</button>
      </div>}
      {remove.isError && <p className="lesson-comment-error" role="alert">{discussionErrorText(remove.error)}</p>}
      {like.isError && <p className="lesson-comment-error" role="alert">{discussionErrorText(like.error)}</p>}
      {replying && !comment.deleted && <CommentForm lessonId={comment.lessonId} parentId={comment.id} onSent={() => { setReplying(false); setExpanded(true) }} onCancel={() => setReplying(false)} />}
      {expanded && <Replies comment={comment} />}
    </div>
  </article>
}

export function LessonComments({ lessonId }: { lessonId: number }) {
  const { user } = useAuth()
  const [page, setPage] = useState(0)
  const list = useQuery({ queryKey: ['lesson-comments', user?.id, lessonId, 'roots', page],
    queryFn: () => lessonCommentApi.list(lessonId, page), retry: false, refetchInterval: 30000 })
  useEffect(() => {
    if (list.data && page > 0 && page >= list.data.totalPages) setPage(Math.max(0, list.data.totalPages - 1))
  }, [list.data, page])
  return <section className="lesson-comments" aria-label="Bình luận bài học">
    <header className="lesson-comments-heading"><div><h2>Bình luận bài học{list.data ? ` (${list.data.totalElements})` : ''}</h2>
      <p>Chia sẻ cảm nhận và trao đổi cùng các học viên có quyền học khóa này.</p></div>
      <button type="button" disabled={list.isFetching} onClick={() => void list.refetch()}>Làm mới</button>
    </header>
    {list.isPending && <p role="status">Đang tải bình luận…</p>}
    {list.isError && <div className="lesson-comment-error" role="alert"><p>{discussionErrorText(list.error)}</p><button type="button" onClick={() => void list.refetch()}>Thử lại</button></div>}
    {list.isSuccess && <><CommentForm lessonId={lessonId} onSent={() => setPage(0)} />
      {list.data.content.length === 0 ? <p className="lesson-comments-empty">Chưa có bình luận. Hãy là người đầu tiên chia sẻ về bài học!</p>
        : <div className="lesson-comments-list">{list.data.content.map(comment => <Comment key={comment.id} comment={comment} />)}</div>}
      <Pagination page={page} pages={list.data.totalPages} busy={list.isFetching} change={setPage} label="Trang bình luận" />
    </>}
  </section>
}
