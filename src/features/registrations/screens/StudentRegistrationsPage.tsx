import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useStudentRegistration, useStudentRegistrations } from '../../../shared/hooks/useStudentRegistrations'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import { coursePrice } from '../../courses/screens/PublicCourseCard'
import type { StudentRegistration } from '../api/registrationApi'
import './registrations.css'
const labels: Record<StudentRegistration['status'], string> = { PENDING_PAYMENT: 'Chờ thanh toán', ACTIVE: 'Đang hoạt động', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn', FAILED: 'Thất bại' }
export function StudentRegistrationsPage() {
  const [params, setParams] = useSearchParams()
  const rawPage = Number(params.get('page') ?? 0)
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const request = new URLSearchParams(params)
  request.set('page', String(page))
  request.set('size', '20')
  const query = useStudentRegistrations(request)
  const filtered = ['q', 'status', 'packageDuration', 'minAmount', 'maxAmount'].some(key => Boolean(params.get(key)))
  const setPage = (next: number) => { const updated = new URLSearchParams(params); updated.set('page', String(next)); setParams(updated) }
  return <section className="registration-page"><h1>Đăng ký của tôi</h1>
    <RegistrationFilters key={params.toString()} params={params} apply={setParams} />
    {query.isPending ? <p role="status">Đang tải đăng ký…</p> : query.isError ? <div role="alert">{courseError(query.error)} <button onClick={() => void query.refetch()}>Thử lại</button></div> : <>
      {query.data.content.length === 0 && <p>{filtered ? 'Không có đăng ký phù hợp với bộ lọc.' : 'Bạn chưa có đăng ký khóa học.'}</p>}
      <div className="registration-table"><table><thead><tr><th>Khóa học</th><th>Gói</th><th>Số tiền</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead><tbody>{query.data.content.map(r => <tr key={r.id}><td>{r.courseTitle}</td><td>{r.packageName ?? 'Gói cũ chưa lưu'}</td><td>{coursePrice(r.amount)}</td><td>{labels[r.status]}</td><td><Link to={`/student/registrations/${r.id}${params.size ? `?${params}` : ''}`}>Chi tiết</Link></td></tr>)}</tbody></table></div>
      <nav className="registration-pagination" aria-label="Phân trang đăng ký">
        <span className="registration-pagination-count" aria-live="polite">{query.data.totalElements} đăng ký</span>
        <div className="registration-pagination-controls">
          <span className="registration-pagination-page">Trang {query.data.totalPages === 0 ? 0 : page + 1} / {query.data.totalPages}</span>
          <button type="button" aria-label="Trang trước" title="Trang trước" disabled={page === 0 || query.isFetching} onClick={() => setPage(page - 1)}><span aria-hidden="true">&lsaquo;</span></button>
          <button type="button" aria-label="Trang sau" title="Trang sau" disabled={page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setPage(page + 1)}><span aria-hidden="true">&rsaquo;</span></button>
        </div>
      </nav>
    </>}
  </section>
}
function RegistrationFilters({ params, apply }: { params: URLSearchParams; apply: (params: URLSearchParams) => void }) {
  const [error, setError] = useState('')
  return <form className="registration-list-filters" onSubmit={event => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const key of ['q', 'status', 'packageDuration', 'minAmount', 'maxAmount']) {
      const value = String(data.get(key) ?? '').trim()
      if (value) next.set(key, value)
    }
    if (next.has('minAmount') && next.has('maxAmount') && Number(next.get('minAmount')) > Number(next.get('maxAmount'))) {
      setError('Số tiền từ phải nhỏ hơn hoặc bằng số tiền đến.'); return
    }
    setError(''); apply(next)
  }}>
    <label className="registration-filter-search">Khóa học / mã đăng ký<input name="q" type="search" maxLength={200} defaultValue={params.get('q') ?? ''} placeholder="Tên khóa học hoặc #61" /></label>
    <label>Trạng thái<select name="status" defaultValue={params.get('status') ?? ''}><option value="">Tất cả trạng thái</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Gói học<select name="packageDuration" defaultValue={params.get('packageDuration') ?? ''}><option value="">Tất cả gói học</option><option value="ONE_MONTH">1 tháng</option><option value="ONE_YEAR">1 năm</option><option value="LIFETIME">Vĩnh viễn</option></select></label>
    <label>Số tiền từ (VND)<input name="minAmount" type="number" min="0" max="999999999999.99" step="0.01" defaultValue={params.get('minAmount') ?? ''} placeholder="0" /></label>
    <label>Số tiền đến (VND)<input name="maxAmount" type="number" min="0" max="999999999999.99" step="0.01" defaultValue={params.get('maxAmount') ?? ''} placeholder="Không giới hạn" /></label>
    <div className="registration-filter-actions"><button className="course-primary" type="submit">Áp dụng</button><button type="button" onClick={() => { setError(''); apply(new URLSearchParams()) }}>Xóa bộ lọc</button></div>
    {error && <p className="registration-filter-error" role="alert">{error}</p>}
  </form>
}
export function StudentRegistrationDetailPage() {
  const { id } = useParams()
  const query = useStudentRegistration(Number(id))
  const location = useLocation()
  const reused = (location.state as { reused?: boolean } | null)?.reused
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) return <p role="alert">Mã đăng ký không hợp lệ.</p>
  if (query.isPending) return <p role="status">Đang tải đăng ký…</p>
  if (query.isError) return <div role="alert">{courseError(query.error)} <Link to={`/student/registrations${location.search}`}>Về đăng ký của tôi</Link></div>
  const r = query.data
  return <section className="registration-page"><Link to={`/student/registrations${location.search}`}>← Đăng ký của tôi</Link><h1>Đăng ký #{r.id}</h1>
    {reused && <p role="status">Bạn đã có đăng ký chờ thanh toán. Hệ thống mở lại đăng ký cũ, không tạo trùng.</p>}
    <article className="course-panel"><h2>{r.courseTitle}</h2><p>Trạng thái: {labels[r.status]}</p><p>Học viên: {r.fullName} · {r.email} · {r.phone ?? 'Chưa lưu'}</p><p>Gói: {r.packageName ?? 'Gói cũ chưa lưu'}{r.durationMonths ? ` (${r.durationMonths} tháng)` : ''}</p>
      <p>Giá gốc: {r.originalPrice == null ? 'Chưa lưu' : coursePrice(r.originalPrice)} · Giảm giá: {r.discountAmount == null ? 'Chưa lưu' : coursePrice(r.discountAmount)}</p><h2>Số tiền đã chốt: {coursePrice(r.amount)}</h2>
      {r.paymentPending ? <p className="registration-notice">Đăng ký đang chờ thanh toán, chưa có quyền học. <Link to={`/student/registrations/${r.id}/payment`}>Tiếp tục thanh toán QR</Link></p> : <p>Hiệu lực: {r.validFrom ? new Date(r.validFrom).toLocaleString('vi-VN') : 'Chưa cấp'} → {r.lifetime && r.validFrom ? 'Vĩnh viễn' : r.validUntil ? new Date(r.validUntil).toLocaleString('vi-VN') : 'Chưa cấp'}</p>}
      <p>Giá/gói của đăng ký này không thay đổi khi Expert chỉnh giá khóa học.</p>
    </article>
  </section>
}
