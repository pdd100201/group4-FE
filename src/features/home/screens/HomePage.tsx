import { Link } from 'react-router-dom'
import { usePublishedCourses } from '../../../shared/hooks/usePublishedCourses'
import { PublicCourseCard } from '../../courses/screens/PublicCourseCard'
import '../../courses/screens/public-courses.css'

export function HomePage() {
  const query = usePublishedCourses()
  const courses = query.data ?? []
  const categories = [...new Set(courses.map(course => course.category).filter((category): category is string => Boolean(category)))].slice(0, 4)
  return <>
    <section className="hero"><div><em>✦ NỀN TẢNG HỌC TRỰC TUYẾN 4.0</em>
      <h1>Khám Phá & Nâng Tầm<br />Kỹ Năng Cùng <span>Chuyên Gia</span></h1>
      <p>Học tập chủ động với bài giảng chất lượng, luyện tập quiz trắc nghiệm và lộ trình cá nhân hóa hướng tới mục tiêu thực tế.</p>
      <div className="search-box">⌕ <input placeholder="Bạn muốn tìm kiếm khóa học hay kỹ năng nào?" /><Link className="primary-button small" to="/courses">Tìm kiếm</Link></div>
    </div><div className="hero-art"><b>[ Banner: Sinh viên học tập trực tuyến ]</b><i /><i /></div></section>
    <section className="landing-section"><h2>Danh Mục Phổ Biến</h2>
      <div className="categories">{categories.map(name =>
        <article key={name}><b>{name}</b><small>{courses.filter(course => course.category === name).length} khóa học</small></article>)}</div>
      <div className="section-title"><h2>Khóa Học Tiêu Biểu</h2><Link to="/courses">Xem tất cả khóa học →</Link></div>
      {query.isPending && <p role="status">Đang tải khóa học…</p>}
      {query.isError && <div role="alert"><p>Không tải được khóa học.</p><button onClick={() => void query.refetch()}>Thử lại</button></div>}
      {!query.isPending && !query.isError && courses.length === 0 && <p>Chưa có khóa học được xuất bản.</p>}
      <div className="course-grid">{courses.slice(0, 4).map(course => <PublicCourseCard course={course} key={course.id} />)}</div>
      <div className="section-title"><h2>Bài Viết Mới Nhất</h2><Link to="/blog">Xem tất cả bài viết →</Link></div>
      <div className="post-grid">{['Bí quyết vượt qua kỳ thực tập IT', 'Kỹ thuật nhớ lâu với Active Recall', 'Cân bằng tham vọng trong thiết kế UI'].map(title =>
        <article key={title}><div className="thumbnail">[Hình ảnh]</div><small>Cẩm nang · 18 Thg, 2026</small><b>{title}</b><Link to="/blog/1">Đọc chi tiết →</Link></article>)}</div>
    </section>
  </>
}
