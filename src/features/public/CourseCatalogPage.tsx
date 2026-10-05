import { Link } from 'react-router-dom'
import { usePublishedCourses } from '../../hooks/usePublishedCourses'

export function CourseCatalogPage() {
  const { data: courses = [], isLoading, isError, refetch } = usePublishedCourses()
  return <section className="landing-section">
    <h1>Khóa học</h1>
    {isLoading && <p>Đang tải khóa học...</p>}
    {isError && <div role="alert">Không tải được khóa học. <button onClick={() => refetch()}>Thử lại</button></div>}
    {!isLoading && !isError && courses.length === 0 && <p>Chưa có khóa học được xuất bản.</p>}
    <div className="course-grid">{courses.map(course => <Link className="course-card" to={`/courses/${course.id}`} key={course.id}>
      <div className="course-image blue">{course.category ?? 'Khóa học trực tuyến'}</div>
      <div><b>{course.title}</b><p>{course.description}</p><strong>{course.price == null ? 'Liên hệ' : `${course.price.toLocaleString('vi-VN')} đ`}</strong></div>
    </Link>)}</div>
  </section>
}
