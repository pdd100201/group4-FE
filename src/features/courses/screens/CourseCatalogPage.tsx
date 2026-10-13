import { usePublishedCourses } from '../../../shared/hooks/usePublishedCourses'
import { PublicCourseCard } from './PublicCourseCard'
import './public-courses.css'
import { useSearchParams } from 'react-router-dom'

export function CourseCatalogPage() {
  const [params] = useSearchParams()
  const search = (params.get('search') || '').trim()
  const category = params.get('category') || ''
  const { data: results = [], isLoading, isError, refetch } = usePublishedCourses({ search, category })
  return <section className="landing-section">
    <h1>Khóa học</h1>
    {isLoading && <p>Đang tải khóa học...</p>}
    {isError && <div role="alert">Không tải được khóa học. <button onClick={() => refetch()}>Thử lại</button></div>}
    {!isLoading && !isError && results.length === 0 && <p>Không có khóa học phù hợp.</p>}
    <div className="course-grid">{results.map(course => <PublicCourseCard key={course.id} course={course} />)}</div>
  </section>
}
