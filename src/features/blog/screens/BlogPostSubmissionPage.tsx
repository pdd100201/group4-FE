import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MediaUpload } from '../../../shared/components/media/MediaUpload'
import { blogApi, type PostSubmissionInput } from '../api/blogApi'
import { useAuth } from '../../../shared/context/AuthContext'
import './blog.css'

const initialForm: PostSubmissionInput = { title: '', category: '', summary: '', content: '', thumbnailMediaId: 0 }

function submitError(error: unknown) {
  return isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || 'Không gửi được bài viết. Vui lòng thử lại.' : 'Không gửi được bài viết.'
}

export function BlogPostSubmissionPage() {
  const { user } = useAuth()
  const canPublish = Boolean(user?.roles.some(role => role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER'))
  const actionTitle = canPublish ? 'Đăng bài viết' : 'Gửi bài viết'
  const navigate = useNavigate()
  const client = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const submit = useMutation({ mutationFn: blogApi.submitPost, onSuccess: async result => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['my-post-submissions'] }),
      client.invalidateQueries({ queryKey: ['public-posts'] }),
      client.invalidateQueries({ queryKey: ['public-post-categories'] }),
    ])
    navigate(result.published && result.status === 'PUBLISHED'
      ? '/blog/my-submissions?published=1' : '/blog/my-submissions?submitted=1')
  } })
  const busy = submit.isPending || uploading

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError('')
    if (!form.thumbnailMediaId) { setValidationError('Hãy tải ảnh đại diện trước khi gửi bài.'); return }
    try { await submit.mutateAsync(form) } catch { /* The API error is displayed in the form. */ }
  }

  return <section className="blog-submission-page">
    <header className="blog-submission-heading"><div><p><Link to="/">Trang chủ</Link> / <Link to="/blog">Bài viết</Link> / {actionTitle}</p><h1>{actionTitle}</h1><p>{canPublish ? 'Bài viết được xuất bản ngay sau khi đăng.' : 'Bài viết sẽ được Manager kiểm duyệt trước khi hiển thị công khai.'}</p></div><Link className="blog-submission-secondary" to="/blog/my-submissions">Bài viết của tôi</Link></header>
    {(submit.isError || validationError) && <p role="alert" className="blog-submission-error">{validationError || submitError(submit.error)}</p>}
    <form className="blog-submission-form" onSubmit={event => void onSubmit(event)}>
      <div className="blog-submission-fields">
        <label>Tiêu đề *<input required maxLength={255} value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} /></label>
        <label>Danh mục *<input required maxLength={255} value={form.category} placeholder="Ví dụ: Lập trình & Công nghệ" onChange={event => setForm(current => ({ ...current, category: event.target.value }))} /></label>
        <label>Tóm tắt *<textarea required rows={3} maxLength={1000} value={form.summary} onChange={event => setForm(current => ({ ...current, summary: event.target.value }))} /></label>
        <label>Nội dung bài viết *<textarea required rows={18} maxLength={12000} value={form.content} onChange={event => setForm(current => ({ ...current, content: event.target.value }))} /></label>
        <small className="blog-submission-counter">{form.content.length}/12000 ký tự</small>
      </div>
      <aside className="blog-submission-media">
        <h2>Ảnh đại diện *</h2>
        {thumbnailUrl ? <img src={thumbnailUrl} alt="Ảnh đại diện bài viết" /> : <p>Thêm ảnh để bài viết dễ nhận biết.</p>}
        <MediaUpload purpose="CONTENT_IMAGE" disabled={busy} onBusy={setUploading} onUploaded={media => {
          setForm(current => ({ ...current, thumbnailMediaId: media.id }))
          setThumbnailUrl(media.url ?? '')
        }} />
        <p>{canPublish ? 'Với vai trò Admin/Manager, bạn có thể đăng bài trực tiếp, không cần gửi duyệt.' : 'Sau khi gửi, bài viết sẽ ở trạng thái chờ duyệt. Bài chưa được công khai trong thời gian này.'}</p>
      </aside>
      <div className="blog-submission-actions"><Link to="/blog">Hủy</Link><button type="submit" disabled={busy}>{busy ? (canPublish ? 'Đang đăng…' : 'Đang gửi…') : (canPublish ? 'Đăng bài viết' : 'Gửi duyệt')}</button></div>
    </form>
  </section>
}
