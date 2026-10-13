import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { usePublishedCourses } from '../../../shared/hooks/usePublishedCourses'
import { useBlogPosts } from '../../../shared/hooks/useBlogPosts'
import { PostCard } from '../../blog/screens/PostCard'
import '../../blog/screens/blog.css'
import { PublicCourseCard } from '../../courses/screens/PublicCourseCard'
import '../../courses/screens/public-courses.css'
import './HomePage.css'

export function HomePage() {
  const query = usePublishedCourses()
  const posts = useBlogPosts({ page: 0, size: 3 })
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const courses = [...(query.data ?? [])].sort((a, b) => b.id - a.id)
  const categories = [...new Set(courses.map(course => course.category).filter((category): category is string => Boolean(category)))].slice(0, 4)
  return <div className="home-page">
    <section className="hero"><div><em>✦ NỀN TẢNG HỌC TRỰC TUYẾN 4.0</em>
      <h1>Khám Phá & Nâng Tầm<br />Kỹ Năng Cùng <span>Chuyên Gia</span></h1>
      <p>Học tập chủ động với bài giảng chất lượng, luyện tập quiz trắc nghiệm và lộ trình cá nhân hóa hướng tới mục tiêu thực tế.</p>
      <form className="search-box" onSubmit={event => { event.preventDefault(); navigate(`/courses?search=${encodeURIComponent(search.trim())}`) }}>⌕ <input aria-label="Tìm kiếm khóa học" name="search" maxLength={255} value={search} onChange={event => setSearch(event.target.value)} placeholder="Bạn muốn tìm kiếm khóa học hay kỹ năng nào?" /><button type="submit">Tìm kiếm</button></form>
    </div><div className="hero-art" role="img" aria-label="Học tập trực tuyến"><i /><i /></div></section>
    <section className="landing-section"><h2>Danh Mục Phổ Biến</h2>
      <div className="categories">{categories.map(name =>
        <article key={name}><Link to={`/courses?category=${encodeURIComponent(name)}`}><b>{name}</b></Link><small>{courses.filter(course => course.category === name).length} khóa học</small></article>)}</div>
      <div className="section-title"><h2>Khóa Học Tiêu Biểu</h2><Link to="/courses">Xem tất cả khóa học →</Link></div>
      {query.isPending && <p role="status">Đang tải khóa học…</p>}
      {query.isError && <div role="alert"><p>Không tải được khóa học.</p><button onClick={() => void query.refetch()}>Thử lại</button></div>}
      {!query.isPending && !query.isError && courses.length === 0 && <p>Chưa có khóa học được xuất bản.</p>}
      <div className="course-grid">{courses.slice(0, 4).map(course => <PublicCourseCard course={course} key={course.id} />)}</div>
      <div className="section-title"><h2>Bài Viết Mới Nhất</h2><Link to="/blog">Xem tất cả bài viết →</Link></div>
      {posts.isPending && <p role="status">Đang tải bài viết…</p>}
      {posts.isError && <div role="alert"><p>Không tải được bài viết.</p><button onClick={() => void posts.refetch()}>Thử lại</button></div>}
      {!posts.isPending && !posts.isError && posts.data.content.length === 0 && <p>Chưa có bài viết được xuất bản.</p>}
      <div className="post-grid">{posts.data?.content.map(post => <PostCard key={post.id} post={post} compact />)}</div>
    </section>
  </div>
}
