import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { useBlogCategories, useBlogPosts } from '../../../shared/hooks/useBlogPosts'
import { blogApi, type BlogPost } from '../api/blogApi'
import { postDate } from './PostCard'
import './blog.css'
import './blog-showcase.css'

type BlogEntry = { key: string; post: BlogPost }

function createEntry(post: BlogPost): BlogEntry {
  return { key: `post-${post.id}`, post }
}

function readMinutes(post: BlogPost, content?: string) {
  const words = `${post.title} ${post.summary ?? ''} ${content ?? ''}`.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function recentEntrySymbol(post: BlogPost) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const category = normalize(post.category ?? '')
  const title = normalize(post.title)
  if (/\b(sql|query|database)\b/.test(title)) return 'SQL'
  if (category.includes('ui/ux')) return 'UI'
  if (category.includes('phuong phap hoc tap')) return 'MEM'
  if (category.includes('lap trinh')) return 'IT'
  return category.split(/\s+/).filter(Boolean).slice(0, 3).map(word => word[0]).join('').toUpperCase() || 'IT'
}

function BlogShowcaseSidebar({
  activeCategory,
  categories,
  recentEntries,
  onChooseCategory,
  totalCount,
}: {
  activeCategory: string
  categories: Array<{ name: string; count: number }>
  recentEntries: BlogEntry[]
  onChooseCategory: (category: string) => void
  totalCount?: number
}) {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterState, setNewsletterState] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [isSubscribing, setIsSubscribing] = useState(false)

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = newsletterEmail.trim()
    if (!email) return
    setIsSubscribing(true)
    setNewsletterState(null)
    try {
      const response = await blogApi.subscribeNewsletter(email)
      setNewsletterState({ kind: 'success', message: response.message || 'Đăng ký nhận bản tin thành công.' })
      setNewsletterEmail('')
    } catch (error) {
      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      setNewsletterState({ kind: 'error', message: responseMessage || 'Không thể đăng ký lúc này. Vui lòng thử lại sau.' })
    } finally {
      setIsSubscribing(false)
    }
  }

  return <aside className="blog-showcase-sidebar">
    <section className="showcase-sidebar-card showcase-category-card">
      <h2>Danh mục bài viết</h2>
      <button className={!activeCategory ? 'active' : ''} onClick={() => onChooseCategory('')}>Tất cả bài viết <span>({totalCount ?? '—'})</span></button>
      {categories.map(category => <button className={activeCategory === category.name ? 'active' : ''} key={category.name} onClick={() => onChooseCategory(category.name)}>{category.name}<span>({category.count})</span></button>)}
      {!categories.length && <p className="showcase-empty-small">Chưa có danh mục.</p>}
    </section>
    <section className="showcase-sidebar-card showcase-recent-card">
      <h2>Bài viết mới nhất</h2>
      {recentEntries.slice(0, 4).map(entry => <Link className="showcase-recent-item" key={entry.key} to={`/blog/${entry.post.id}`}>
        <span className="showcase-recent-icon">{recentEntrySymbol(entry.post)}</span>
        <div><b>{entry.post.title}</b><small>{postDate(entry.post.updatedAt)}</small></div>
      </Link>)}
      {recentEntries.length === 0 && <p className="showcase-empty-small">Chưa có bài viết mới.</p>}
    </section>
    <section className="showcase-newsletter">
      <h2>📬 Đăng ký bản tin</h2>
      <p>Nhận bài học và lộ trình mới qua email mỗi tuần.</p>
      <form onSubmit={subscribe}>
        <input type="email" aria-label="Email đăng ký" placeholder="name@example.com" autoComplete="email" maxLength={255} required value={newsletterEmail} onChange={event => setNewsletterEmail(event.target.value)} disabled={isSubscribing} />
        <button type="submit" disabled={isSubscribing}>{isSubscribing ? 'Đang đăng ký…' : 'Đăng ký ngay'}</button>
      </form>
      {newsletterState && <p className={`showcase-newsletter-feedback ${newsletterState.kind}`} role={newsletterState.kind === 'error' ? 'alert' : 'status'}>{newsletterState.message}</p>}
    </section>
  </aside>
}

function BlogShowcaseCard({ entry, index }: {
  entry: BlogEntry
  index: number
}) {
  const tone = ['blue', 'green', 'violet', 'amber'][index % 4]
  return <article className="showcase-post-card">
    <Link className="showcase-card-select" to={`/blog/${entry.post.id}`} aria-label={`Đọc bài viết: ${entry.post.title}`}>
        <span className={`showcase-card-cover tone-${tone}${entry.post.thumbnailUrl ? ' has-image' : ''}`}>
        {entry.post.thumbnailUrl ? <img src={entry.post.thumbnailUrl} alt="" loading="lazy" /> : <><b>{entry.post.category?.toUpperCase() ?? 'BLOG & BÀI VIẾT'}</b><span>[ Ảnh bìa bài viết: {entry.post.title} ]</span></>}
      </span>
      <span className="showcase-card-body">
        <span className="showcase-card-category">{entry.post.category ?? 'Chưa phân loại'}</span>
        <strong>{entry.post.title}</strong>
        <span className="showcase-card-meta">Tác giả: <b>{entry.post.authorName}</b> · {postDate(entry.post.updatedAt)} · {readMinutes(entry.post)} phút đọc</span>
        <span className="showcase-card-summary">{entry.post.summary || 'Bài viết chưa có phần tóm tắt.'}</span>
        <span className="showcase-read-link">Đọc toàn bộ bài viết →</span>
      </span>
    </Link>
  </article>
}

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
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const search = params.get('search') || ''
  const category = params.get('category') || ''
  const rawPage = Number(params.get('page') || '0')
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const catalog = useBlogPosts({ page: 0, size: 100 })
  const categoriesQuery = useBlogCategories()
  const allEntries = useMemo(() => [
    ...(catalog.data?.content ?? []).map(createEntry),
  ].sort((a, b) => Date.parse(b.post.updatedAt ?? b.post.createdAt ?? '') - Date.parse(a.post.updatedAt ?? a.post.createdAt ?? '')),
  [catalog.data?.content])
  const filteredEntries = useMemo(() => allEntries.filter(entry => {
    const matchesCategory = !category || entry.post.category === category
    const query = search.trim().toLocaleLowerCase('vi')
    const matchesSearch = !query || `${entry.post.title} ${entry.post.summary ?? ''} ${entry.post.category ?? ''} ${entry.post.authorName}`.toLocaleLowerCase('vi').includes(query)
    return matchesCategory && matchesSearch
  }), [allEntries, category, search])
  const pageSize = 9
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const entries = filteredEntries.slice(safePage * pageSize, (safePage + 1) * pageSize)
  const categoryNames = [...new Set([...(categoriesQuery.data ?? []), ...allEntries.map(entry => entry.post.category).filter((value): value is string => Boolean(value))])]
  const categories = categoryNames.map(name => ({ name, count: allEntries.filter(entry => entry.post.category === name).length }))
  const sidebarEntries = allEntries

  const setCategory = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('category', value); else next.delete('category')
    next.delete('page')
    setParams(next)
  }
  const goPage = (value: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(value))
    setParams(next)
  }
  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const keyword = String(new FormData(event.currentTarget).get('search') || '').trim()
    const next = new URLSearchParams(params)
    if (keyword) next.set('search', keyword); else next.delete('search')
    next.delete('page')
    setParams(next)
  }

  return <div className="blog-showcase blog-showcase-list-only">
    <div className="blog-showcase-topline"><Link to="/blog"><b>EduLearn</b><span> — Cẩm Nang Tri Thức &amp; Tin Tức Giáo Dục</span></Link><small>Kiến thức, kinh nghiệm và phương pháp học tập</small><div className="showcase-post-actions">{user && <Link className="showcase-my-submissions" to="/blog/my-submissions">Bài viết của tôi</Link>}<Link className="showcase-submit-post" to={user ? '/blog/submit' : '/login'} state={user ? undefined : { from: '/blog/submit' }}>{user ? '✎ Gửi bài viết' : 'Đăng nhập để viết bài'}</Link></div></div>
    <div className="blog-showcase-panels">
      <section className="blog-showcase-list-panel" aria-label="Danh sách bài viết">
        <header className="blog-showcase-list-header">
          <div className="showcase-list-breadcrumb"><span>BLOG &amp; BÀI VIẾT</span><small><Link to="/">Trang chủ</Link> / <b>Bài viết</b></small></div>
          <h1>Cẩm Nang Học Tập &amp; Định Hướng Nghề Nghiệp</h1>
          <p>Tổng hợp kinh nghiệm thực chiến từ chuyên gia, lộ trình sự nghiệp và phương pháp học hiện đại.</p>
          <form className="showcase-search" onSubmit={onSearch}><span aria-hidden="true">⌕</span><input key={search} name="search" aria-label="Tìm kiếm bài viết" maxLength={255} defaultValue={search} placeholder="Tìm kiếm bài viết theo từ khóa (Java, Spring, UI/UX, Phương pháp học...)" /><button aria-label="Tìm kiếm">⌕</button></form>
        </header>
        <div className="blog-showcase-list-body">
          <div className="blog-showcase-cards">
            {catalog.isPending && <p className="showcase-loading" role="status">Đang tải bài viết…</p>}
            {catalog.isError && <div className="showcase-loading" role="alert">Không tải được các bài viết mới. <button onClick={() => void catalog.refetch()}>Thử lại</button></div>}
            {entries.map((entry, index) => <BlogShowcaseCard key={entry.key} entry={entry} index={index} />)}
            {!catalog.isPending && entries.length === 0 && <p className="showcase-loading">Không tìm thấy bài viết phù hợp.</p>}
          </div>
          <BlogShowcaseSidebar activeCategory={category} categories={categories} recentEntries={sidebarEntries} onChooseCategory={setCategory} totalCount={allEntries.length} />
        </div>
        {totalPages > 1 && <nav className="showcase-pagination" aria-label="Phân trang bài viết">
          <button aria-label="Trang trước" disabled={safePage === 0} onClick={() => goPage(safePage - 1)}>‹</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
            const value = Math.max(0, Math.min(safePage - 2, totalPages - 5)) + index
            return <button key={value} aria-current={safePage === value ? 'page' : undefined} onClick={() => goPage(value)}>{value + 1}</button>
          })}
          {totalPages > 5 && <span>…</span>}<button aria-label="Trang sau" disabled={safePage >= totalPages - 1} onClick={() => goPage(safePage + 1)}>›</button>
        </nav>}
      </section>
    </div>
    <p className="blog-showcase-copyright">© 2026 EduLearn Inc. Chuyên mục Tin tức &amp; Cẩm nang Đào tạo Trực tuyến. Mọi quyền được bảo lưu.</p>
  </div>
}
