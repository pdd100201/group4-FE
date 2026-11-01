import { isAxiosError } from 'axios'
import { Link, useParams } from 'react-router-dom'
import { useBlogDetail } from '../../../shared/hooks/useBlogPosts'
import { BlogSidebar } from './BlogListPage'
import { postDate } from './PostCard'
import { SafePostContent } from './SafePostContent'
import { CommentSection } from './CommentSection'
import './blog.css'

// Existing public detail route hosts UC60-64. UC09 remains assigned to the other member.
export function BlogDetailPage() {
  const { postId } = useParams()
  const id = Number(postId)
  const query = useBlogDetail(id)
  if (!Number.isSafeInteger(id) || id <= 0) return <section className="landing-section"><h1>Mã bài viết không hợp lệ</h1><Link to="/blog">Quay lại bài viết</Link></section>
  if (query.isPending) return <section className="landing-section"><p role="status">Đang tải bài viết…</p></section>
  if (query.isError) return <section className="landing-section" role="alert"><h1>{isAxiosError(query.error) && query.error.response?.status === 404 ? 'Bài viết không còn hiển thị' : 'Không tải được bài viết'}</h1>
    <button onClick={() => void query.refetch()}>Thử lại</button> <Link to="/blog">Quay lại bài viết</Link></section>
  const { post, content } = query.data
  return <div className="blog-layout"><article className="blog-article">
    <p><Link to="/">Trang chủ</Link> / <Link to="/blog">Bài viết</Link> / {post.category}</p>
    <h1>{post.title}</h1><p className="blog-meta">{post.authorName} · {postDate(post.updatedAt)}</p>
    {post.thumbnailUrl && <div className="post-cover"><img src={post.thumbnailUrl} alt={post.title} /></div>}
    {post.summary && <p className="blog-post-summary">{post.summary}</p>}
    <SafePostContent content={content} /><CommentSection key={id} postId={id} />
  </article><BlogSidebar /></div>
}
