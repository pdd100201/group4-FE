import { Link } from 'react-router-dom'
import type { CourseSummary } from '../api/courseApi'

export function coursePrice(price: number | null) {
  return price == null ? 'Chưa có giá' : `${price.toLocaleString('vi-VN')} ₫`
}
export function PublicCourseCard({ course }: { course: CourseSummary }) {
  return <Link className="course-card" to={`/courses/${course.id}`}>
    <div className="course-image blue public-course-image">{course.thumbnailUrl
      ? <img loading="lazy" src={course.thumbnailUrl} alt={`Ảnh khóa học ${course.title}`} />
      : <span>{course.category || 'Khóa học trực tuyến'}</span>}</div>
    <div><small>{course.category || 'Chưa phân loại'}</small><b>{course.title}</b><p>Giảng viên: {course.expertName || 'Chưa cập nhật'}</p><strong>{coursePrice(course.price)}</strong></div>
  </Link>
}
