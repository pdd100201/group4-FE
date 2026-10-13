import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useStudentCourses } from '../../../shared/hooks/useStudentCourses'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import './student-courses.css'

function date(value: string) { return new Date(value).toLocaleDateString('vi-VN') }

export function StudentCoursesPage() {
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const query = useStudentCourses(page, search, sort)
  function apply(event: FormEvent) { event.preventDefault(); setPage(0); setSearch(draft.trim()) }
  return <section className="student-courses-page"><header className="student-courses-heading"><div><h1>Khóa học của tôi</h1>{query.data && <p>{query.data.totalElements} khóa học còn hiệu lực{search && ' phù hợp tìm kiếm'}</p>}</div><Link to="/courses">Khám phá khóa học</Link></header>
    <form className="student-courses-filters" onSubmit={apply}><label htmlFor="my-course-search">Tên khóa học<input id="my-course-search" type="search" maxLength={200} placeholder="Tìm khóa học của bạn" value={draft} onChange={event => setDraft(event.target.value)} /></label>
      <label htmlFor="my-course-sort">Sắp xếp<select id="my-course-sort" value={sort} onChange={event => { setSort(event.target.value); setPage(0) }}><option value="newest">Mới kích hoạt</option><option value="title">Tên khóa học</option></select></label><button type="submit">Tìm kiếm</button>
    </form>
    {query.isPending ? <p role="status">Đang tải khóa học…</p> : query.isError ? <div role="alert">{courseError(query.error)} <button onClick={() => void query.refetch()}>Thử lại</button></div> : <>
      {query.data.content.length === 0 ? <div className="student-courses-empty"><h2>{search ? 'Không tìm thấy khóa học' : 'Chưa có khóa học còn hiệu lực'}</h2><Link to={search ? '/student/courses' : '/student/registrations'} onClick={() => { if (search) { setDraft(''); setSearch(''); setPage(0) } }}>{search ? 'Xóa tìm kiếm' : 'Xem đăng ký của tôi'}</Link></div> : <div className="student-courses-grid">{query.data.content.map(course => <article className="student-course-card" key={course.courseId}>
        {course.thumbnailUrl && <img className="student-course-cover" src={course.thumbnailUrl} alt={`Ảnh khóa học ${course.title}`} loading="lazy" />}
        <div className="student-course-content"><small>{course.category ?? 'Khóa học'}</small><h2>{course.title}</h2><p>Giảng viên: {course.expertName}</p><dl><dt>Gói học</dt><dd>{course.packageName ?? 'Gói đã đăng ký'}</dd><dt>Kích hoạt</dt><dd>{date(course.validFrom)}</dd><dt>Hiệu lực đến</dt><dd>{course.lifetime ? 'Vĩnh viễn' : course.validUntil ? date(course.validUntil) : 'Chưa lưu'}</dd></dl>
          {!course.available && <p className="student-course-unavailable" role="status">Khóa học đang tạm ngừng hiển thị.</p>}
          <div className="student-course-actions">{course.available && <><Link className="primary-button" to={`/student/courses/${course.courseId}/learn`}>Vào học</Link><Link to={`/courses/${course.courseId}`}>Thông tin khóa học</Link></>}<Link to={`/student/registrations/${course.registrationId}`}>Chi tiết đăng ký</Link></div>
        </div></article>)}</div>}
      <nav className="student-courses-pagination" aria-label="Phân trang khóa học"><span>Trang {query.data.totalPages ? page + 1 : 0} / {query.data.totalPages}</span><button type="button" title="Trang trước" aria-label="Trang trước" disabled={page === 0 || query.isFetching} onClick={() => setPage(value => value - 1)}>‹</button><button type="button" title="Trang sau" aria-label="Trang sau" disabled={page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setPage(value => value + 1)}>›</button></nav>
    </>}
  </section>
}
