import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useBlogCategories, useBlogPosts } from '../../../shared/hooks/useBlogPosts'
import { PostCard } from './PostCard'
import './blog.css'

export function BlogSidebar() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const categories = useBlogCategories()
  const recent = useBlogPosts({ page: 0, size: 3 })
  const chooseCategory = (category: string) => {
    const next = new URLSearchParams(params)
    if (category) next.set('category', category); else next.delete('category')
    next.delete('page')
    navigate(`/blog?${next.toString()}`)
  }
  return <aside className="blog-sidebar">
    <section><h2>Danh mục</h2><button onClick={() => chooseCategory('')} aria-pressed={!params.get('category')}>Tất cả</button>
      {categories.isPending && <p role="status">Đang tải danh mục…</p>}
      {categories.isError && <p role="alert">Không tải được danh mục. <button onClick={() => void categories.refetch()}>Thử lại</button></p>}
      {categories.data?.map(category => <button className="blog-category" key={category} aria-pressed={params.get('category') === category} onClick={() => chooseCategory(category)}>{category}</button>)}
    </section>
    <section><h2>Bài viết gần đây</h2>
      {recent.isPending && <p role="status">Đang tải…</p>}
      {recent.isError && <p role="alert">Không tải được bài viết. <button onClick={() => void recent.refetch()}>Thử lại</button></p>}
      {recent.data?.content.map(post => <Link key={post.id} to={`/blog/${post.id}`}>{post.title}</Link>)}
      {recent.data?.content.length === 0 && <p>Chưa có bài viết.</p>}
    </section>
  </aside>
}

export function BlogListPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') || ''
  const category = params.get('category') || ''
  const rawPage = Number(params.get('page') || '0')
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const posts = useBlogPosts({ search, category, page, size: 9 })
  const goPage = (value: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(value)); setParams(next)
  }
  return <div className="blog-layout"><section>
    <p><Link to="/">Trang chủ</Link> / Bài viết</p><h1>Cẩm Nang Học Tập & Định Hướng Nghề Nghiệp</h1>
    <p className="blog-meta">Tổng hợp kinh nghiệm thực chiến từ chuyên gia, lộ trình sự nghiệp và phương pháp học hiện đại.</p>
    <form className="blog-search" onSubmit={event => {
      event.preventDefault()
      const keyword = String(new FormData(event.currentTarget).get('search') || '').trim()
      const next = new URLSearchParams(params)
      if (keyword) next.set('search', keyword); else next.delete('search')
      next.delete('page'); setParams(next)
    }}><input key={search} name="search" aria-label="Tìm bài viết" maxLength={255} defaultValue={search} placeholder="Tìm kiếm bài viết…" /><button className="primary-button">Tìm kiếm</button></form>
    {posts.isPending && <p role="status">Đang tải bài viết…</p>}
    {posts.isError && <div className="blog-feedback" role="alert">Không tải được bài viết. <button onClick={() => void posts.refetch()}>Thử lại</button></div>}
    {posts.data?.content.length === 0 && <p>Không tìm thấy bài viết phù hợp.</p>}
    <div className="blog-list">{posts.data?.content.map(post => <PostCard post={post} key={post.id} />)}</div>
    {posts.data && posts.data.totalPages > 0 && <nav className="blog-pagination" aria-label="Phân trang bài viết">
      <button disabled={page === 0} onClick={() => goPage(page - 1)}>Trước</button>
      <span aria-live="polite">Trang {page + 1} / {posts.data.totalPages}</span>
      {Array.from({ length: Math.min(5, posts.data.totalPages) }, (_, i) => {
        const value = Math.max(0, Math.min(page - 2, posts.data!.totalPages - 5)) + i
        return <button key={value} aria-current={page === value ? 'page' : undefined} onClick={() => goPage(value)}>{value + 1}</button>
      })}
      <button disabled={page >= posts.data.totalPages - 1} onClick={() => goPage(page + 1)}>Sau</button>
    </nav>}
  </section><BlogSidebar /></div>
}
