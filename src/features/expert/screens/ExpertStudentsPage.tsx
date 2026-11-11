import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../shared/context/AuthContext'
import { courseStatusLabels, expertCourseApi } from '../api/expertCourseApi'
import { expertStudentsApi, type RegistrationStatus } from '../api/expertStudentsApi'
import { courseError } from './ExpertCoursesPage'
import { coursePrice } from '../../courses/screens/PublicCourseCard'
import { ExpertRegistrationDetailModal } from './ExpertRegistrationDetailModal'
import './courses.css'
import './expert-students.css'

const labels: Record<RegistrationStatus, string> = { ACTIVE: 'Còn hạn', EXPIRED: 'Hết hạn' }
const paymentLabels: Record<string, string> = { PENDING: 'Chờ thanh toán', SUCCEEDED: 'Đã thanh toán', FAILED: 'Thất bại', CANCELLED: 'Đã hủy', REFUNDED: 'Đã hoàn tiền' }
const accessLabels = { CURRENT: 'Còn hạn', EXPIRED: 'Hết hạn', UPCOMING: 'Chưa đến hạn', NOT_ACTIVATED: 'Chưa kích hoạt' }
const date = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '—'
const pageOf = (params: URLSearchParams) => { const p = Number(params.get('page') ?? 0); return Number.isSafeInteger(p) && p >= 0 ? p : 0 }

export function ExpertStudentsPage() {
  const [params, setParams] = useSearchParams()
  const page = pageOf(params)
  const { user } = useAuth()
  const query = useQuery({ queryKey: ['expert-students-courses', user?.id, params.toString()], queryFn: () => expertCourseApi.list({ search: params.get('q') ?? '', category: '', status: params.get('status') ?? '', page }), enabled: Boolean(user) })
  return <main className="expert-courses expert-students-page">
    <header className="course-heading"><div><p className="expert-students-eyebrow">QUẢN LÝ KHÓA HỌC</p><h1>Danh sách học viên</h1><p>Chọn khóa học của bạn để xem người đã đăng ký và tình trạng quyền học.</p></div></header>
    <form className="expert-students-filters" key={params.toString()} onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); const next = new URLSearchParams(); for (const key of ['q', 'status']) { const value = String(form.get(key) ?? '').trim(); if (value) next.set(key, value) } setParams(next) }}>
      <label>Tìm khóa học<input name="q" type="search" maxLength={200} defaultValue={params.get('q') ?? ''} placeholder="Tên khóa học…" /></label>
      <label>Trạng thái<select name="status" defaultValue={params.get('status') ?? ''}><option value="">Tất cả trạng thái</option>{Object.entries(courseStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="course-primary" type="submit">Tìm kiếm</button>
      <button type="button" onClick={() => setParams(new URLSearchParams())}>Xóa bộ lọc</button>
    </form>
    {query.isPending ? <p role="status">Đang tải khóa học…</p> : query.isError ? <div role="alert"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div> : <>
      <p>{query.data.totalElements} khóa học của bạn</p>
      {!query.data.content.length ? <div className="course-panel"><p>Không có khóa học phù hợp.</p><Link to="/expert/courses">Về danh sách khóa học</Link></div> : <div className="expert-students-courses">{query.data.content.map(course => <Link className="expert-students-course" key={course.id} to={`/expert/students/${course.id}`}>
        {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" loading="lazy" /> : <div className="expert-students-cover" aria-hidden="true">E</div>}
        <div><span className={`course-status status-${course.status.toLowerCase()}`}>{courseStatusLabels[course.status]}</span><h2>{course.title}</h2><p>{course.category || 'Chưa có danh mục'} · Mã #{course.id}</p><strong>Xem danh sách học viên →</strong></div>
      </Link>)}</div>}
      <Pagination page={page} pages={query.data.totalPages} busy={query.isFetching} setPage={next => { const value = new URLSearchParams(params); value.set('page', String(next)); setParams(value) }} />
    </>}
  </main>
}

export function ExpertCourseStudentsPage() {
  const { courseId } = useParams()
  const [selectedRegistration, setSelectedRegistration] = useState<number | null>(null)
  const id = Number(courseId)
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const page = pageOf(params)
  const selectedStatus = ['ACTIVE', 'EXPIRED'].includes(params.get('status') ?? '') ? params.get('status')! : ''
  const valid = Number.isSafeInteger(id) && id > 0
  const query = useQuery({ queryKey: ['expert-course-students', user?.id, id, params.toString()], queryFn: () => expertStudentsApi.list(id, { q: params.get('q') ?? '', status: selectedStatus, page }), enabled: valid && Boolean(user), refetchInterval: 30000 })
  function filter(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const next = new URLSearchParams(); const search = String(form.get('q') ?? '').trim(); if (search) next.set('q', search); const status = String(form.get('status') ?? ''); if (status) next.set('status', status); setParams(next) }
  if (!valid) return <main className="expert-courses"><p role="alert">Mã khóa học không hợp lệ.</p><Link to="/expert/students">Danh sách học viên</Link></main>
  return <main className="expert-courses expert-students-page">
    <Link to="/expert/students">← Chọn khóa học khác</Link>
    <header className="course-heading"><div><p className="expert-students-eyebrow">HỌC VIÊN ĐĂNG KÝ</p><h1>{query.data?.courseTitle ?? 'Danh sách học viên'}</h1><p>Khóa học #{id}{query.data && <> · {courseStatusLabels[query.data.courseStatus]}</>}</p></div><button disabled={query.isFetching} onClick={() => void query.refetch()}>Làm mới</button></header>
    {query.isPending ? <p role="status">Đang tải danh sách học viên…</p> : query.isError ? <div role="alert"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div> : <>
      <section className="expert-students-summary" aria-label="Tổng quan toàn khóa"><article><span>Học viên đã đăng ký</span><strong>{query.data.summary.students}</strong></article><article><span>Lượt đăng ký</span><strong>{query.data.summary.registrations}</strong></article><article><span>Đang có quyền học</span><strong>{query.data.summary.currentStudents}</strong></article><article><span>Lượt học đã hết hạn</span><strong>{query.data.summary.expiredRegistrations}</strong></article></section>
      <form className="expert-students-filters" key={params.toString()} onSubmit={filter}><label>Tìm học viên<input name="q" type="search" maxLength={200} defaultValue={params.get('q') ?? ''} placeholder="Tên, email hoặc mã đăng ký…" /></label><label>Thời hạn học<select key={params.get('status') ?? ''} name="status" defaultValue={selectedStatus}><option value="">Tất cả trạng thái</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="submit" className="course-primary">Lọc danh sách</button><button type="button" onClick={() => setParams(new URLSearchParams())}>Xóa bộ lọc</button></form>
      <p>{query.data.totalElements} lượt đăng ký phù hợp. Một học viên có thể có nhiều lượt đăng ký hoặc gia hạn.</p>
      <div className="course-table-wrap"><table className="course-table expert-students-table"><caption className="studio-sr-only">Học viên đăng ký {query.data.courseTitle}</caption><thead><tr><th>Học viên</th><th>Đăng ký & gói học</th><th>Số tiền</th><th>Thanh toán</th><th>Quyền học</th><th>Ngày đăng ký</th><th>Thao tác</th></tr></thead><tbody>
        {!query.data.items.length ? <tr><td colSpan={7}>Chưa có học viên đã đăng ký phù hợp với bộ lọc.</td></tr> : query.data.items.map(row => <tr key={row.registrationId}><td><strong>{row.studentName}</strong><small>{row.studentEmail}</small></td><td>#{row.registrationId} · {row.packageName ?? 'Gói cũ chưa lưu'}</td><td>{row.amount == null ? 'Chưa lưu' : coursePrice(row.amount)}</td><td>{row.paymentStatus ? paymentLabels[row.paymentStatus] ?? row.paymentStatus : 'Chưa có bản ghi'}</td><td><span className={`expert-students-access access-${row.accessStatus.toLowerCase()}`}>{accessLabels[row.accessStatus]}</span>{row.validFrom && <small>Từ {date(row.validFrom)}</small>}{row.accessStatus !== 'NOT_ACTIVATED' && <small>{row.lifetime ? 'Vĩnh viễn' : `Đến ${date(row.validUntil)}`}</small>}</td><td>{date(row.createdAt)}</td><td><button type="button" className="registration-detail-trigger" aria-haspopup="dialog" aria-label={`Xem chi tiết đăng ký #${row.registrationId} của ${row.studentName}`} onClick={() => setSelectedRegistration(row.registrationId)}>Chi tiết</button></td></tr>)}
      </tbody></table></div>
      <Pagination page={page} pages={query.data.totalPages} busy={query.isFetching} setPage={next => { const value = new URLSearchParams(params); value.set('page', String(next)); setParams(value) }} />
    </>}
    {selectedRegistration !== null && <ExpertRegistrationDetailModal key={`${id}:${selectedRegistration}`} courseId={id} registrationId={selectedRegistration} onClose={() => setSelectedRegistration(null)} />}
  </main>
}

function Pagination({ page, pages, busy, setPage }: { page: number; pages: number; busy: boolean; setPage: (page: number) => void }) {
  return <nav className="course-pagination" aria-label="Phân trang"><span>Trang {pages === 0 ? 0 : page + 1} / {pages}</span><button disabled={page === 0 || busy} onClick={() => setPage(page - 1)}>← Trước</button><button disabled={page + 1 >= pages || busy} onClick={() => setPage(page + 1)}>Sau →</button></nav>
}
