import { usePublishedCourses } from '../../hooks/usePublishedCourses'
import { PublicCourseCard } from './PublicCourseCard'
import './public-courses.css'

export function CourseCatalogPage() {
  const { data: courses = [], isLoading, isError, refetch } = usePublishedCourses()
  return <section className="landing-section">
    <h1>Khóa học</h1>
    {isLoading && <p>Đang tải khóa học...</p>}
    {isError && <div role="alert">Không tải được khóa học. <button onClick={() => refetch()}>Thử lại</button></div>}
    {!isLoading && !isError && courses.length === 0 && <p>Chưa có khóa học được xuất bản.</p>}
    <div className="course-grid">{courses.map(course => <PublicCourseCard key={course.id} course={course} />)}</div>
  </section>
}
