import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MediaUpload } from '../../../shared/components/media/MediaUpload'
import { useManagerPosts } from '../../../shared/hooks/useManagerPosts'
import { managerPostApi, type ManagedPost, type ModerationStatus, type PostInput } from '../api/managerPostApi'
import type { BlogComment } from '../../blog/api/blogApi'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import '../../expert/screens/courses.css'
import './manager-posts.css'

export type Editor = { mode: 'create' } | { mode: 'edit'; post: ManagedPost }
const managerPostPageSize = 10
const moderationLabels: Record<ModerationStatus, string> = { VISIBLE: 'Đang hiển thị', HIDDEN: 'Đã ẩn', DISABLED: 'Đã tắt' }
const postStatusLabels: Record<ManagedPost['status'], string> = { DRAFT: 'Bản nháp', PENDING_REVIEW: 'Chờ duyệt', PUBLISHED: 'Đã xuất bản', REJECTED: 'Không được duyệt' }

export function ManagerPostsPage() {
  const [page, setPage] = useState(0)
  const [editor, setEditor] = useState<Editor | null>(null)
  const query = useManagerPosts(page, managerPostPageSize)

  return <section className="expert-courses manager-posts">
    <header className="course-heading">
      <div><h1>Quản lý bài viết</h1><p>Quản lý nội dung, trạng thái xuất bản và kiểm duyệt bình luận trên blog.</p></div>
      <div className="manager-post-heading-actions">
        <button onClick={() => setEditor({ mode: 'create' })}>Tạo bài viết</button>
        <button onClick={() => void query.refetch()} disabled={query.isFetching}>Làm mới</button>
      </div>
    </header>

    {query.isPending ? <p role="status">Đang tải bài viết…</p> : query.isError ? <div role="alert" className="course-error"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div> : <>
      <div className="manager-post-summary"><strong>{query.data.totalElements}</strong> bài viết · Bài gửi từ tài khoản khác cần được duyệt trước khi công khai.</div>
      <section className="manager-post-list-panel manager-post-list-page" aria-label="Danh sách bài viết quản lý">
          <h2>Bài viết</h2>
          <div className="manager-post-card-list">
            {query.data.content.map((item, index) => <article className="manager-post-card" key={item.post.id}>
              <Link className="manager-post-card-select" to={`/manager/posts/${item.post.id}`} aria-label={`Mở chi tiết bài viết ${item.post.title}`}>
                {item.post.thumbnailUrl ? <img className="manager-post-card-image" src={item.post.thumbnailUrl} alt="" loading="lazy" /> : <span className="manager-post-card-placeholder">{item.post.category?.slice(0, 3).toUpperCase() || 'BLOG'}</span>}
                <span className="manager-post-card-content"><span className="manager-post-card-category">{item.post.category || 'Chưa phân loại'}</span><strong>{item.post.title}</strong><span className="manager-post-card-summary">{item.post.summary || 'Chưa có tóm tắt.'}</span><small>{item.post.authorName} · {item.post.updatedAt ? new Date(item.post.updatedAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</small></span>
              </Link>
              <div className="manager-post-card-footer"><span className={`course-status manager-post-status status-${item.status.toLowerCase()}`}>{postStatusLabels[item.status]}</span><span>#{query.data.totalElements - (page * managerPostPageSize + index)}</span></div>
            </article>)}
            {!query.data.content.length && <div className="manager-post-empty"><h2>Chưa có bài viết</h2><p>Tạo bài viết đầu tiên để nội dung xuất hiện tại đây.</p><button className="course-primary" onClick={() => setEditor({ mode: 'create' })}>Tạo bài viết</button></div>}
          </div>
      </section>
      <div className="course-pagination"><span>{query.data.totalElements} bài viết · Trang {page + 1}/{Math.max(1, query.data.totalPages)}</span><button disabled={page === 0 || query.isFetching} onClick={() => setPage(current => current - 1)}>Trước</button><button disabled={page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setPage(current => current + 1)}>Sau</button></div>
    </>}

    {editor && <PostEditor key={editor.mode === 'create' ? 'new' : editor.post.post.id} editor={editor} onClose={() => setEditor(null)} />}
  </section>
}

export function PostEditor({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const actions = useManagerPostActions()
  const original = editor.mode === 'edit' ? editor.post : undefined
  const [form, setForm] = useState<PostInput>({
    title: original?.post.title ?? '', category: original?.post.category ?? '',
    summary: original?.post.summary ?? '', content: original?.content ?? '',
    thumbnailMediaId: null, published: original?.published ?? false,
  })
  const [thumbnailUrl, setThumbnailUrl] = useState(original?.post.thumbnailUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const mutation = editor.mode === 'create' ? actions.create : actions.update
  const saving = mutation.isPending || uploading

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError('')
    if (saving) return
    const missingPublicationFields = [
      !form.category.trim() ? 'danh mục' : '',
      !form.summary.trim() ? 'tóm tắt' : '',
      !thumbnailUrl && !form.thumbnailMediaId ? 'ảnh đại diện' : '',
    ].filter(Boolean)
    if (form.published && missingPublicationFields.length) {
      setValidationError(`Chưa thể xuất bản: cần bổ sung ${missingPublicationFields.join(', ')}. Hoặc chọn “Bản nháp” để lưu trước.`)
      return
    }
    try {
      if (editor.mode === 'create') await actions.create.mutateAsync(form)
      else await actions.update.mutateAsync({ id: editor.post.post.id, input: form })
      onClose()
    } catch { /* The API error remains visible in the editor. */ }
  }

  return <div className="course-modal-backdrop manager-post-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <form className="course-modal manager-post-editor" role="dialog" aria-modal="true" aria-labelledby="manager-post-editor-title" onSubmit={event => void submit(event)}>
      <header className="manager-post-editor-heading"><div><h2 id="manager-post-editor-title">{original ? 'Chỉnh sửa bài viết' : 'Tạo bài viết'}</h2><p>{form.published ? 'Bài viết đang ở trạng thái xuất bản.' : 'Bản nháp chỉ hiển thị với người quản lý.'}</p></div><button type="button" aria-label="Đóng" disabled={saving} onClick={onClose}>×</button></header>
      {(mutation.isError || validationError) && <p role="alert" className="course-error">{validationError || courseError(mutation.error)}</p>}
      <div className="manager-post-editor-grid">
        <div className="manager-post-fields">
          <label>Tiêu đề *<input required maxLength={255} value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} /></label>
          <label>Danh mục<input maxLength={255} value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} /></label>
          <label>Tóm tắt<textarea maxLength={1000} rows={3} value={form.summary} onChange={event => setForm(current => ({ ...current, summary: event.target.value }))} /></label>
          <label>Nội dung bài viết *<textarea required maxLength={12000} rows={14} value={form.content} onChange={event => setForm(current => ({ ...current, content: event.target.value }))} /></label>
          <small className="manager-post-counter">{form.content.length}/12000 ký tự</small>
        </div>
        <aside className="manager-post-editor-side">
          <label>Trạng thái<select value={form.published ? 'published' : 'draft'} onChange={event => setForm(current => ({ ...current, published: event.target.value === 'published' }))}><option value="draft">Bản nháp</option><option value="published">Xuất bản</option></select></label>
          <div className="manager-post-image-panel"><h3>Ảnh đại diện</h3>{thumbnailUrl ? <img src={thumbnailUrl} alt="Ảnh đại diện bài viết" /> : <p>Chưa có ảnh. Bài viết cần ảnh để xuất bản.</p>}<MediaUpload purpose="CONTENT_IMAGE" disabled={saving} onBusy={setUploading} onUploaded={media => { setForm(current => ({ ...current, thumbnailMediaId: media.id })); setThumbnailUrl(media.url ?? thumbnailUrl) }} /></div>
          {original && <Link to={`/blog/${original.post.id}`} target="_blank" rel="noreferrer">Xem bài viết công khai ↗</Link>}
        </aside>
      </div>
      <footer className="manager-post-editor-footer"><button type="button" disabled={saving} onClick={onClose}>Hủy</button><button className="course-primary" type="submit" disabled={saving}>{saving ? 'Đang lưu…' : form.published ? 'Xuất bản bài viết' : 'Lưu bản nháp'}</button></footer>
    </form>
  </div>
}

export function CommentModerationDialog({ post, onClose }: { post: ManagedPost; onClose: () => void }) {
  const client = useQueryClient()
  const [status, setStatus] = useState<ModerationStatus | ''>('')
  const [page, setPage] = useState(0)
  const query = useQuery({
    queryKey: ['manager-post-comments', post.post.id, status, page],
    queryFn: () => managerPostApi.moderationComments(post.post.id, status, page),
  })
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['manager-post-comments', post.post.id] }),
      client.invalidateQueries({ queryKey: ['post-comments', post.post.id] }),
      client.invalidateQueries({ queryKey: ['post-comment', post.post.id] }),
    ])
  }
  const updateStatus = useMutation({
    mutationFn: ({ id, next }: { id: number; next: ModerationStatus }) => managerPostApi.setCommentStatus(id, next),
    onSuccess: refresh,
  })
  const remove = useMutation({ mutationFn: managerPostApi.deleteComment, onSuccess: refresh })
  const busy = updateStatus.isPending || remove.isPending

  async function deleteComment(comment: BlogComment) {
    if (!window.confirm(`Gỡ bình luận của ${comment.authorName} khỏi bài viết? Lịch sử vẫn được lưu.`)) return
    try {
      await remove.mutateAsync(comment.id)
      if (query.data?.content.length === 1 && page > 0) setPage(current => current - 1)
    } catch { /* The API error is displayed in the moderation dialog. */ }
  }

  return <div className="course-modal-backdrop manager-post-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <section className="course-modal manager-post-editor manager-comment-moderation" role="dialog" aria-modal="true" aria-labelledby="comment-moderation-title">
      <header className="manager-post-editor-heading"><div><h2 id="comment-moderation-title">Kiểm duyệt bình luận</h2><p>{post.post.title}</p></div><button type="button" aria-label="Đóng" disabled={busy} onClick={onClose}>×</button></header>
      <label className="manager-comment-filter">Lọc trạng thái<select value={status} onChange={event => { setStatus(event.target.value as ModerationStatus | ''); setPage(0) }}><option value="">Tất cả trạng thái</option><option value="VISIBLE">Đang hiển thị</option><option value="HIDDEN">Đã ẩn</option><option value="DISABLED">Đã tắt</option></select></label>
      {(updateStatus.isError || remove.isError) && <p role="alert" className="course-error">{courseError(updateStatus.error ?? remove.error)}</p>}
      {query.isPending ? <p role="status">Đang tải bình luận…</p> : query.isError ? <div role="alert" className="course-error"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div> : <>
        <p className="manager-comment-count">{query.data.totalElements} bình luận cần kiểm duyệt</p>
        <div className="manager-comment-list">{query.data.content.map(comment => <ModerationCommentRow key={comment.id} comment={comment} busy={busy} onStatus={async next => { try { await updateStatus.mutateAsync({ id: comment.id, next }) } catch { /* Error is displayed above the list. */ } }} onDelete={() => void deleteComment(comment)} />)}</div>
        {!query.data.content.length && <p className="manager-post-empty">Không có bình luận ở trạng thái này.</p>}
        <div className="course-pagination"><span>Trang {page + 1}/{Math.max(1, query.data.totalPages)}</span><button disabled={page === 0 || query.isFetching || busy} onClick={() => setPage(current => current - 1)}>Trước</button><button disabled={page + 1 >= query.data.totalPages || query.isFetching || busy} onClick={() => setPage(current => current + 1)}>Sau</button></div>
      </>}
    </section>
  </div>
}

function ModerationCommentRow({ comment, busy, onStatus, onDelete }: { comment: BlogComment; busy: boolean; onStatus: (status: ModerationStatus) => Promise<void>; onDelete: () => void }) {
  const current = comment.status === 'DELETED' ? 'VISIBLE' : comment.status
  const [nextStatus, setNextStatus] = useState<ModerationStatus>(current)
  return <article className="manager-comment-row">
    <div className="manager-comment-body"><div><b>{comment.authorName}</b><small>{comment.createdAt ? new Date(comment.createdAt).toLocaleString('vi-VN') : '—'} · #{comment.id}</small></div><span className={`course-status manager-comment-status status-${comment.status.toLowerCase()}`}>{moderationLabels[current]}</span><p>{comment.content}</p></div>
    <div className="manager-comment-actions"><label><span className="sr-only">Trạng thái bình luận</span><select value={nextStatus} disabled={busy} onChange={event => setNextStatus(event.target.value as ModerationStatus)}><option value="VISIBLE">Hiển thị</option><option value="HIDDEN">Ẩn</option><option value="DISABLED">Tắt</option></select></label><button disabled={busy || nextStatus === current} onClick={() => void onStatus(nextStatus)}>Lưu trạng thái</button><button className="course-danger" disabled={busy} onClick={onDelete}>Gỡ bình luận</button></div>
  </article>
}
