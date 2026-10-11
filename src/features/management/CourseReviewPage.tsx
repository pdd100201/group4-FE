import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useManagerCourses } from '../../hooks/useManagerCourses'
import { courseStatusLabels } from '../../services/expertCourseService'
import type { ReviewFilters } from '../../services/managerCourseService'
import { courseError } from '../expert/ExpertCoursesPage'
import '../expert/courses.css'

export function CourseReviewPage() {
  const [filters, setFilters] = useState<ReviewFilters>({ search: '', category: '', status: 'PENDING_REVIEW', page: 0 })
  const query = useManagerCourses(filters)
  function filter(key: 'search' | 'category' | 'status', value: string) { setFilters(current => ({ ...current, [key]: value, page: 0 })) }
  return <section className="expert-courses"><header className="course-heading"><div><h1>Duyệt khóa học</h1><p>Xem trước nội dung và xét duyệt khóa học do Expert gửi.</p></div><button onClick={() => void query.refetch()} disabled={query.isFetching}>Làm mới</button></header>
    <div className="course-filters"><label>Tìm kiếm<input type="search" placeholder="Tên khóa học" value={filters.search} onChange={e => filter('search', e.target.value)} /></label><label>Danh mục<input placeholder="Nhập danh mục chính xác" value={filters.category} onChange={e => filter('category', e.target.value)} /></label><label>Trạng thái<select value={filters.status} onChange={e => filter('status', e.target.value)}><option value="">Tất cả</option>{Object.entries(courseStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {query.isPending ? <p role="status">Đang tải khóa học…</p> : query.isError ? <div role="alert"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div> : <><div className="course-table-wrap"><table className="course-table"><thead><tr><th>Khóa học</th><th>Expert</th><th>Danh mục</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{query.data.content.map(c => <tr key={c.id}><td><Link to={`/manager/courses/${c.id}/review`}>{c.title}</Link><small>#{c.id}</small></td><td>{c.expertName}</td><td>{c.category}</td><td><span className={`course-status status-${c.status.toLowerCase()}`}>{courseStatusLabels[c.status]}</span></td><td><Link to={`/manager/courses/${c.id}/review`}>{c.status === 'PENDING_REVIEW' ? 'Xem và xét duyệt' : 'Xem chi tiết'}</Link></td></tr>)}</tbody></table></div>{query.data.content.length === 0 && <p className="course-empty">Không có khóa học phù hợp với bộ lọc.</p>}<div className="course-pagination"><span>{query.data.totalElements} khóa học · Trang {filters.page + 1}/{Math.max(1, query.data.totalPages)}</span><button disabled={filters.page === 0 || query.isFetching} onClick={() => setFilters(c => ({ ...c, page: c.page - 1 }))}>Trước</button><button disabled={filters.page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setFilters(c => ({ ...c, page: c.page + 1 }))}>Sau</button></div></>}
  </section>
}
