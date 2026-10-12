import axios from 'axios'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCourseActions, useExpertCourses } from '../../../shared/hooks/useExpertCourses'
import { courseStatusLabels, type CourseFilters, type ExpertCourse } from '../api/expertCourseApi'
import './courses.css'
export function courseError(error: unknown) { return axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message ?? 'Không thể kết nối máy chủ.' : 'Không thể thực hiện thao tác.' }
export function ExpertCoursesPage() {
  const [filters, setFilters] = useState<CourseFilters>({ search: '', category: '', status: '', page: 0 })
  const [deleting, setDeleting] = useState<ExpertCourse | null>(null)
  const [message, setMessage] = useState('')
  const query = useExpertCourses(filters)
  const { remove } = useCourseActions()
  function filter(key: 'search' | 'category' | 'status', value: string) { setFilters(current => ({ ...current, [key]: value, page: 0 })) }
  async function confirmDelete() {
    if (!deleting) return
    try { await remove.mutateAsync(deleting.id); setDeleting(null); setMessage('Đã xóa khóa học.'); if (query.data?.content.length === 1 && filters.page > 0) setFilters(current => ({ ...current, page: current.page - 1 })) } catch { /* Error displayed below. */ }
  }
  return <section className="expert-courses">
    <header className="course-heading"><div><h1>Quản lý khóa học</h1><p>Tạo và quản lý khóa học của bạn.</p></div><Link className="course-primary" to="/expert/courses/new">+ Tạo khóa học</Link></header>
    {message && <p role="status" className="course-success">{message}</p>}
    <div className="course-filters"><label>Tìm kiếm<input type="search" value={filters.search} onChange={e => filter('search', e.target.value)} placeholder="Tên khóa học" /></label><label>Danh mục<input value={filters.category} onChange={e => filter('category', e.target.value)} placeholder="Nhập danh mục chính xác" /></label><label>Trạng thái<select value={filters.status} onChange={e => filter('status', e.target.value)}><option value="">Tất cả</option>{Object.entries(courseStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {query.isPending ? <p role="status">Đang tải…</p> : query.isError ? <div role="alert"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div> : <><div className="course-table-wrap"><table className="course-table"><thead><tr><th>Khóa học</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{query.data.content.map(c => <tr key={c.id}><td><Link to={`/expert/courses/${c.id}`}>{c.title}</Link><small>#{c.id}</small></td><td>{c.category}</td><td>{(c.price ?? 0).toLocaleString('vi-VN')} ₫</td><td><span className={`course-status status-${c.status.toLowerCase()}`}>{courseStatusLabels[c.status]}</span></td><td><div className="course-row-actions"><Link to={`/expert/courses/${c.id}`}>{c.editable ? 'Chỉnh sửa' : 'Xem chi tiết'}</Link>{c.deletable && <button className="course-danger" onClick={() => { remove.reset(); setDeleting(c) }}>Xóa</button>}</div></td></tr>)}</tbody></table></div>{query.data.content.length === 0 && <p className="course-empty">Chưa có khóa học phù hợp. Hãy tạo khóa học hoặc đổi bộ lọc.</p>}<div className="course-pagination"><span>{query.data.totalElements} khóa học · Trang {filters.page + 1}/{Math.max(1, query.data.totalPages)}</span><button disabled={filters.page === 0 || query.isFetching} onClick={() => setFilters(c => ({ ...c, page: c.page - 1 }))}>Trước</button><button disabled={filters.page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setFilters(c => ({ ...c, page: c.page + 1 }))}>Sau</button></div></>}
    {deleting && <div className="course-modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="delete-course-title" className="course-modal"><h2 id="delete-course-title">Xóa khóa học?</h2><p>Bạn muốn xóa “{deleting.title}”? Thao tác không thể hoàn tác.</p>{remove.isError && <p role="alert" className="course-error">{courseError(remove.error)}</p>}<div className="course-row-actions"><button autoFocus disabled={remove.isPending} onClick={() => setDeleting(null)}>Hủy</button><button className="course-danger" disabled={remove.isPending} onClick={() => void confirmDelete()}>{remove.isPending ? 'Đang xóa…' : 'Xác nhận xóa'}</button></div></section></div>}
  </section>
}
