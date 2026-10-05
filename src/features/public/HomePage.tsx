import { Link } from 'react-router-dom'
import { featuredCourses } from './featuredCourses'

export function HomePage() {
  return <>
    <section className="hero"><div><em>✦ NỀN TẢNG HỌC TRỰC TUYẾN 4.0</em>
      <h1>Khám Phá & Nâng Tầm<br />Kỹ Năng Cùng <span>Chuyên Gia</span></h1>
      <p>Học tập chủ động với bài giảng chất lượng, luyện tập quiz trắc nghiệm và lộ trình cá nhân hóa hướng tới mục tiêu thực tế.</p>
      <div className="search-box">⌕ <input placeholder="Bạn muốn tìm kiếm khóa học hay kỹ năng nào?" /><Link className="primary-button small" to="/courses">Tìm kiếm</Link></div>
    </div><div className="hero-art"><b>[ Banner: Sinh viên học tập trực tuyến ]</b><i /><i /></div></section>
    <section className="landing-section"><h2>Danh Mục Phổ Biến</h2>
      <div className="categories">{['▣ Công nghệ & Lập trình', '🎨 Thiết kế UI/UX & Đồ họa', '▥ Dữ liệu & Trí tuệ AI', '💼 Kinh doanh & Quản trị'].map((name, index) =>
        <article key={name}><b>{name}</b><small>{[45, 28, 34, 20][index]}+ Khóa học</small></article>)}</div>
      <div className="section-title"><h2>Khóa Học Tiêu Biểu</h2><Link to="/courses">Xem tất cả khóa học →</Link></div>
      <div className="course-grid">{featuredCourses.map(course => <Link className="course-card" to="/courses/1" key={course.title}>
        <div className={`course-image ${course.tone}`}>[ {course.tag} ]</div><div><small>{course.category}</small><b>{course.title}</b><p>GV: TS. Nguyễn Văn An</p><strong>{course.price}</strong></div>
      </Link>)}</div>
      <div className="section-title"><h2>Bài Viết Mới Nhất</h2><Link to="/blog">Xem tất cả bài viết →</Link></div>
      <div className="post-grid">{['Bí quyết vượt qua kỳ thực tập IT', 'Kỹ thuật nhớ lâu với Active Recall', 'Cân bằng tham vọng trong thiết kế UI'].map(title =>
        <article key={title}><div className="thumbnail">[Hình ảnh]</div><small>Cẩm nang · 18 Thg, 2026</small><b>{title}</b><Link to="/blog/1">Đọc chi tiết →</Link></article>)}</div>
    </section>
  </>
}
