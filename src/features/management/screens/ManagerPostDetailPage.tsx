import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useManagerPostActions } from '../../../shared/hooks/useManagerPosts'
import { managerPostApi, managerPostPageSize, type PostManagementRole } from '../api/managerPostApi'
import { type ManagedPost } from '../api/managerPostApi'
import { SafePostContent } from '../../blog/screens/SafePostContent'
import { CommentSection } from '../../blog/screens/CommentSection'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import { CommentModerationDialog, PostEditor, type Editor } from './ManagerPostsPage'
import '../../expert/screens/courses.css'
import '../../blog/screens/blog-showcase.css'
import './manager-posts.css'

const postStatusLabels: Record<ManagedPost['status'], string> = { DRAFT: 'Bản nháp · Chỉ quản lý xem được', PENDING_REVIEW: 'Đang chờ kiểm duyệt', PUBLISHED: 'Đã xuất bản · Đang hiển thị với người học', REJECTED: 'Chưa được duyệt · Chỉ quản lý xem được' }

async function findManagerPostNumber(postId: number, role: PostManagementRole): Promise<number | null> {
  const firstPage = await managerPostApi.list(0, managerPostPageSize, role)
  const findNumber = (page: number, pageNumber: number) => {
    const index = page.content.findIndex(item => item.post.id === postId)
    return index < 0 ? null : firstPage.totalElements - (pageNumber * managerPostPageSize + index)
  }

  const firstNumber = findNumber(firstPage, 0)
  if (firstNumber !== null) return firstNumber

  for (let pageNumber = 1; pageNumber < firstPage.totalPages; pageNumber += 1) {
    const page = await managerPostApi.list(pageNumber, managerPostPageSize, role)
    const number = findNumber(page, pageNumber)
    if (number !== null) return number
  }
  return null
}

export function ManagerPostDetailPage({ role = 'manager' }: { role?: PostManagementRole }) {
  const { postId: routePostId } = useParams()
  const postId = Number(routePostId)
  const validPostId = Number.isSafeInteger(postId) && postId > 0
  const navigate = useNavigate()
  const actions = useManagerPostActions(role)
  const rootPath = `/${role}/posts`
  const [editor, setEditor] = useState<Editor | null>(null)
  const [moderationOpen, setModerationOpen] = useState(false)
  const query = useQuery({
    queryKey: ['manager-post', role, postId],
    queryFn: () => managerPostApi.detail(postId, role),
    enabled: validPostId,
  })
  const postNumberQuery = useQuery({
    queryKey: ['manager-post-number', role, postId],
    queryFn: () => findManagerPostNumber(postId, role),
    enabled: validPostId,
  })
  const post = query.data

  async function removePost() {
    if (!post || !window.confirm(`Xóa bài viết “${post.post.title}” khỏi danh sách? Nội dung và lịch sử sẽ được lưu.`)) return
    try {
      await actions.remove.mutateAsync(post.post.id)
      navigate(rootPath, { replace: true })
    } catch { /* The API error is shown on this page. */ }
  }

  async function reviewPost(decision: 'APPROVE' | 'REJECT') {
    if (!post) return
    const action = decision === 'APPROVE' ? 'duyệt và xuất bản' : 'từ chối'
    if (!window.confirm(`Bạn muốn ${action} bài “${post.post.title}” chứ?`)) return
    try { await actions.review.mutateAsync({ id: post.post.id, decision }) }
    catch { /* The review error is displayed on this page. */ }
  }

  return <section className="expert-courses manager-posts manager-post-detail-page">
    <header className="course-heading">
      <div><h1>Chi tiết bài viết</h1><p>Xem nội dung và quản lý trạng thái của bài viết.</p></div>
      <div className="manager-post-detail-actions">
        <Link to={rootPath} className="manager-post-back-link">← Danh sách bài viết</Link>
        {post && <>
          {post.status === 'PENDING_REVIEW' && <>
            <button className="manager-post-approve" disabled={actions.review.isPending} onClick={() => void reviewPost('APPROVE')}>{actions.review.isPending ? 'Đang kiểm duyệt…' : 'Duyệt & xuất bản'}</button>
            <button className="manager-post-reject" disabled={actions.review.isPending} onClick={() => void reviewPost('REJECT')}>Từ chối</button>
          </>}
          <button onClick={() => setEditor({ mode: 'edit', post })}>Sửa bài</button>
          {post.status === 'PUBLISHED' && <button onClick={() => setModerationOpen(true)}>Kiểm duyệt bình luận</button>}
          <button className="course-danger" disabled={actions.remove.isPending} onClick={() => void removePost()}>{actions.remove.isPending ? 'Đang xóa…' : 'Xóa bài'}</button>
        </>}
      </div>
    </header>

    {!validPostId ? <div role="alert" className="course-error">Mã bài viết không hợp lệ.</div>
      : query.isPending ? <p role="status">Đang tải bài viết…</p>
        : query.isError ? <div role="alert" className="course-error"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div>
          : post && <article className="manager-post-detail-card">
            <div className="manager-post-detail-toolbar"><span className={`course-status manager-post-status status-${post.status.toLowerCase()}`}>{postStatusLabels[post.status]}</span><span>#{postNumberQuery.data ?? '…'}</span></div>
            {actions.review.isError && <p role="alert" className="course-error">{courseError(actions.review.error)}</p>}
            <div className="manager-post-detail-content">
              <p className="manager-post-preview-breadcrumb"><Link to={rootPath}>Quản lý bài viết</Link> / {post.post.category || 'Chưa phân loại'}</p>
              <span className="showcase-detail-category">{post.post.category || 'Chưa phân loại'}</span>
              <h2>{post.post.title}</h2>
              <p className="manager-post-preview-byline">{post.post.authorName} · {post.post.updatedAt ? new Date(post.post.updatedAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
              {post.post.thumbnailUrl ? <img className="manager-post-preview-cover" src={post.post.thumbnailUrl} alt={`Ảnh đại diện: ${post.post.title}`} /> : <div className="manager-post-preview-cover manager-post-preview-cover-empty">Ảnh đại diện chưa được thêm</div>}
              {post.post.summary && <p className="manager-post-preview-summary">{post.post.summary}</p>}
              <SafePostContent content={post.content} />
              {post.status === 'PUBLISHED' && <>
                <Link className="manager-post-public-link" to={`/blog/${post.post.id}`} target="_blank" rel="noreferrer">Mở trang bài viết công khai ↗</Link>
                <CommentSection key={post.post.id} postId={post.post.id} />
              </>}
            </div>
          </article>}

    {editor && <PostEditor key={editor.mode === 'edit' ? editor.post.post.id : 'new'} editor={editor} role={role} onClose={() => setEditor(null)} />}
    {moderationOpen && post && <CommentModerationDialog post={post} role={role} onClose={() => setModerationOpen(false)} />}
  </section>
}
