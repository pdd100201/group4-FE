import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { blogApi, type PostSubmissionStatus } from '../api/blogApi'
import { postDate } from './PostCard'
import './blog.css'

const labels: Record<PostSubmissionStatus, string> = {
  DRAFT: 'Bản nháp', PENDING_REVIEW: 'Đang chờ Manager duyệt', PUBLISHED: 'Đã xuất bản', REJECTED: 'Chưa được duyệt',
}

export function MyPostSubmissionsPage() {
  const [page, setPage] = useState(0)
  const [params] = useSearchParams()
  const query = useQuery({ queryKey: ['my-post-submissions', page], queryFn: () => blogApi.myPostSubmissions(page, 10) })
  return <section className="my-post-submissions">
    <header><div><p><Link to="/blog">Bài viết</Link> / Bài viết đã gửi</p><h1>Bài viết của tôi</h1><p>Theo dõi kết quả kiểm duyệt bài viết bạn gửi.</p></div><Link className="my-post-submit-link" to="/blog/submit">+ Gửi bài viết</Link></header>
    {params.get('submitted') === '1' && <p className="submission-success" role="status">Đã gửi bài. Manager sẽ kiểm duyệt trước khi bài được hiển thị công khai.</p>}
    {query.isPending && <p role="status">Đang tải bài viết…</p>}
    {query.isError && <div role="alert" className="blog-submission-error">{isAxiosError<{ message?: string }>(query.error) ? query.error.response?.data?.message || 'Không tải được danh sách bài viết.' : 'Không tải được danh sách bài viết.'} <button onClick={() => void query.refetch()}>Thử lại</button></div>}
    {query.data && <>
      {query.data.content.length === 0 ? <div className="my-submission-empty"><h2>Bạn chưa gửi bài viết nào</h2><p>Gửi bài để chia sẻ kiến thức với cộng đồng EduLearn.</p><Link to="/blog/submit">Viết bài đầu tiên</Link></div> : <div className="my-submission-list">
        {query.data.content.map(item => <article key={item.post.id}>
          {item.post.thumbnailUrl && <img src={item.post.thumbnailUrl} alt="" />}
          <div><span className={`submission-status submission-${item.status.toLowerCase()}`}>{labels[item.status]}</span><h2>{item.post.title}</h2><p>{item.post.summary}</p><small>{item.post.category} · Cập nhật {postDate(item.post.updatedAt)}</small></div>
          {item.status === 'PUBLISHED' && <Link to={`/blog/${item.post.id}`}>Xem bài ↗</Link>}
        </article>)}
      </div>}
      {query.data.totalPages > 1 && <nav className="my-submission-pagination"><button disabled={page === 0} onClick={() => setPage(value => value - 1)}>Trước</button><span>Trang {page + 1}/{query.data.totalPages}</span><button disabled={page + 1 >= query.data.totalPages} onClick={() => setPage(value => value + 1)}>Sau</button></nav>}
    </>}
  </section>
}
