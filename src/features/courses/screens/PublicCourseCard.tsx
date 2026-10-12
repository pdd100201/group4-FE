import { Link } from 'react-router-dom'
import type { CourseSummary } from '../api/courseApi'
import { useAuth } from '../../../shared/context/AuthContext'
import './public-courses.css'

export function coursePrice(price: number | null) {
  return price == null ? 'Chưa có giá' : `${price.toLocaleString('vi-VN')} ₫`
}
export function PublicCourseCard({ course }: { course: CourseSummary }) {
  const { user } = useAuth()
  const student = user?.roles.includes('ROLE_STUDENT')
  const available = course.price != null
  const detail = `/courses/${course.id}`
  return <article className="course-card">
    <Link className="course-card-cover" to={detail} aria-label={`Xem khóa học ${course.title}`}><div className="course-image blue public-course-image">{course.thumbnailUrl
      ? <img loading="lazy" src={course.thumbnailUrl} alt={`Ảnh khóa học ${course.title}`} />
      : <span>{course.category || 'Khóa học trực tuyến'}</span>}</div></Link>
    <div className="course-card-content"><small>{course.category || 'Chưa phân loại'}</small><Link className="course-card-title" to={detail}><b>{course.title}</b></Link><p>Giảng viên: {course.expertName || 'Chưa cập nhật'}</p>
      <div className="course-card-price">{available ? <><small>Giá từ</small><strong>{coursePrice(course.price)}</strong><span>Gói đang mở · đã áp dụng giảm giá</span></> : <span>Chưa mở gói học</span>}</div>
      <div className="course-card-actions"><Link className="course-detail-link" to={detail}>Xem chi tiết</Link>{student && (available ? <Link className="primary-button course-register-link" to={`${detail}#course-packages`}>Đăng ký khóa học</Link> : <button className="primary-button course-register-link" disabled aria-describedby={`course-package-notice-${course.id}`}>Đăng ký khóa học</button>)}</div>
      {student && !available && <p className="course-registration-unavailable" id={`course-package-notice-${course.id}`}>Expert chưa mở gói giá nên chưa thể đăng ký.</p>}
    </div>
  </article>
}
