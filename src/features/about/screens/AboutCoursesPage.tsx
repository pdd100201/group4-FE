import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PublicCourseCard } from '../../courses/screens/PublicCourseCard'
import { usePublishedCourses } from '../../../shared/hooks/usePublishedCourses'
import '../../courses/screens/public-courses.css'
import './about-courses.css'

const learningFeatures = [
  {
    number: '01',
    title: 'Bài học có cấu trúc',
    description: 'Nội dung được chia thành từng bài học rõ ràng để bạn dễ theo dõi và chủ động sắp xếp thời gian.',
    icon: '▤',
  },
  {
    number: '02',
    title: 'Luyện tập bằng quiz',
    description: 'Câu hỏi và bài kiểm tra giúp bạn ôn lại kiến thức, nhận ra phần cần học thêm sau mỗi chặng.',
    icon: '✓',
  },
  {
    number: '03',
    title: 'Theo dõi tiến độ',
    description: 'Lưu lại quá trình học để bạn tiếp tục từ bài đang học và nhìn rõ những nội dung đã hoàn thành.',
    icon: '↗',
  },
]

const learningSteps = [
  { number: '1', title: 'Chọn khóa học', description: 'Tìm nội dung phù hợp với mục tiêu và trình độ hiện tại của bạn.' },
  { number: '2', title: 'Đăng ký gói học', description: 'Xem thông tin khóa học, chọn gói phù hợp rồi đăng ký để bắt đầu.' },
  { number: '3', title: 'Học và thực hành', description: 'Theo dõi bài học, làm quiz và tiếp tục lộ trình theo tốc độ của riêng bạn.' },
]

export function AboutCoursesPage() {
  const { data: courses = [], isPending, isError, refetch } = usePublishedCourses()
  const featuredCourses = [...courses].sort((a, b) => b.id - a.id).slice(0, 3)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return <div className="about-page">
    <section className="about-hero">
      <div className="about-hero-inner">
        <div className="about-hero-copy">
          <span className="about-eyebrow"><span aria-hidden="true">✦</span> GIỚI THIỆU Edulearn</span>
          <h1>Học điều bạn cần,<br /><span>tiến bộ theo cách của bạn.</span></h1>
          <p>EduLearn giúp bạn tiếp cận khóa học trực tuyến có bài học, quiz và lộ trình theo dõi rõ ràng — để việc học không dừng lại ở xem nội dung.</p>
          <div className="about-hero-actions">
            <Link className="primary-button about-primary-cta" to="/courses">Khám phá khóa học <span aria-hidden="true">→</span></Link>
            <a className="about-secondary-cta" href="#learning-journey">Cách học tại EduLearn</a>
          </div>
        </div>
        <div className="about-hero-visual" aria-label="Minh họa lộ trình học tập trên EduLearn" role="img">
          <div className="about-orbit about-orbit-one" />
          <div className="about-orbit about-orbit-two" />
          <div className="about-study-card">
            <div className="about-study-card-head"><span className="about-study-icon">E</span><span>HÀNH TRÌNH HỌC TẬP</span><b>✦</b></div>
            <h2>Mỗi bài học,<br />một bước tiến mới.</h2>
            <div className="about-study-path">
              <div className="about-path-item"><span>01</span><div><b>Bài học</b><small>Tiếp thu kiến thức</small></div><i>✓</i></div>
              <div className="about-path-line" />
              <div className="about-path-item"><span>02</span><div><b>Luyện tập</b><small>Củng cố bằng quiz</small></div><i>✓</i></div>
              <div className="about-path-line" />
              <div className="about-path-item"><span>03</span><div><b>Tiến bộ</b><small>Tiếp tục lộ trình</small></div><i>↗</i></div>
            </div>
          </div>
          <span className="about-floating-note">Học theo nhịp của bạn</span>
        </div>
      </div>
    </section>

    <section className="about-section about-intro">
      <div className="about-section-heading">
        <span className="about-eyebrow">HỌC TẬP TRỌN VẸN HƠN</span>
        <h2>Từ bài học đến khả năng<br className="about-desktop-break" /> áp dụng kiến thức</h2>
        <p>Một khóa học trên EduLearn kết hợp nội dung, thực hành và theo dõi tiến trình trong cùng một không gian học tập.</p>
      </div>
      <div className="about-feature-grid">
        {learningFeatures.map(feature => <article className="about-feature-card" key={feature.number}>
          <div className="about-feature-top"><span className="about-feature-icon" aria-hidden="true">{feature.icon}</span><small>{feature.number}</small></div>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </article>)}
      </div>
    </section>

    <section className="about-journey" id="learning-journey">
      <div className="about-section about-journey-inner">
        <div className="about-section-heading">
          <span className="about-eyebrow">BẮT ĐẦU THẬT ĐƠN GIẢN</span>
          <h2>Ba bước để bắt đầu<br className="about-desktop-break" /> hành trình của bạn</h2>
          <p>Từ lúc chọn nội dung đến khi hoàn thành bài học, bạn luôn biết mình cần làm gì tiếp theo.</p>
        </div>
        <div className="about-steps">
          {learningSteps.map(step => <article className="about-step" key={step.number}>
            <span className="about-step-number">{step.number}</span>
            <div><h3>{step.title}</h3><p>{step.description}</p></div>
          </article>)}
        </div>
      </div>
    </section>

    <section className="about-section about-courses" id="featured-courses">
      <div className="about-courses-heading">
        <div className="about-section-heading">
          <span className="about-eyebrow">TÌM KHÓA HỌC TIẾP THEO</span>
          <h2>Khám phá nội dung đang mở</h2>
          <p>Xem các khóa học đã được xuất bản và chọn lộ trình phù hợp với mục tiêu của bạn.</p>
        </div>
        <Link className="about-all-courses" to="/courses">Tất cả khóa học <span aria-hidden="true">→</span></Link>
      </div>
      {isPending && <p className="about-course-feedback" role="status">Đang tải khóa học…</p>}
      {isError && <div className="about-course-feedback" role="alert">Chưa tải được danh sách khóa học. <button onClick={() => void refetch()}>Thử lại</button></div>}
      {!isPending && !isError && featuredCourses.length === 0 && <div className="about-empty-courses">
        <span aria-hidden="true">✦</span><div><h3>Danh sách khóa học đang được cập nhật</h3><p>Trong lúc chờ nội dung mới, bạn có thể quay lại xem toàn bộ danh mục khóa học.</p></div><Link to="/courses">Xem danh mục</Link>
      </div>}
      {featuredCourses.length > 0 && <div className="course-grid about-course-grid">{featuredCourses.map(course => <PublicCourseCard course={course} key={course.id} />)}</div>}
    </section>

    <section className="about-final-cta">
      <div><span className="about-eyebrow">SẴN SÀNG BẮT ĐẦU?</span><h2>Chọn khóa học phù hợp với bạn.</h2><p>Khám phá nội dung, xem chi tiết lộ trình và bắt đầu học ngay hôm nay.</p></div>
      <Link className="about-primary-cta" to="/courses">Xem danh sách khóa học <span aria-hidden="true">→</span></Link>
    </section>
  </div>
}
