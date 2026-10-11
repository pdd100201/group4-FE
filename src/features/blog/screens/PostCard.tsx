import { Link } from 'react-router-dom'
import type { BlogPost } from '../api/blogApi'

export function postDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có ngày cập nhật'
}
export function PostCard({ post, compact = false }: { post: BlogPost; compact?: boolean }) {
  return <article className={compact ? 'home-post' : 'blog-post-card'}>
    <Link className="post-cover" to={`/blog/${post.id}`} aria-label={post.title}>
      {post.thumbnailUrl ? <img loading="lazy" src={post.thumbnailUrl} alt={post.title} /> : <span>{post.category || 'Bài viết'}</span>}
    </Link>
    <div><small>{post.category || 'Chưa phân loại'} · {postDate(post.updatedAt)}</small>
      <h2><Link to={`/blog/${post.id}`}>{post.title}</Link></h2>
      {!compact && <p>{post.summary}</p>}
      <div className="blog-card-footer">{!compact && <small>{post.authorName}</small>}<Link to={`/blog/${post.id}`}>{compact ? 'Đọc chi tiết →' : 'Đọc toàn bộ bài viết →'}</Link></div>
    </div>
  </article>
}
