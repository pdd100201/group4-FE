import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useStudentRegistration, useStudentRegistrations } from '../../../shared/hooks/useStudentRegistrations'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import { coursePrice } from '../../courses/screens/PublicCourseCard'
import type { StudentRegistration } from '../api/registrationApi'
import './registrations.css'
const labels: Record<StudentRegistration['status'], string> = { PENDING_PAYMENT: 'Chờ thanh toán', ACTIVE: 'Đang hoạt động', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn', FAILED: 'Thất bại' }
export function StudentRegistrationsPage() {
  const [page, setPage] = useState(0)
  const query = useStudentRegistrations(page)
  return <section className="registration-page"><h1>Đăng ký của tôi</h1>
    {query.isPending ? <p role="status">Đang tải đăng ký…</p> : query.isError ? <div role="alert">{courseError(query.error)} <button onClick={() => void query.refetch()}>Thử lại</button></div> : <>
      {query.data.content.length === 0 && <p>Bạn chưa có đăng ký khóa học.</p>}
      <div className="registration-table"><table><thead><tr><th>Khóa học</th><th>Gói</th><th>Số tiền</th><th>Trạng thái</th><th /></tr></thead><tbody>{query.data.content.map(r => <tr key={r.id}><td>{r.courseTitle}</td><td>{r.packageName ?? 'Gói cũ chưa lưu'}</td><td>{coursePrice(r.amount)}</td><td>{labels[r.status]}</td><td><Link to={`/student/registrations/${r.id}`}>Chi tiết</Link></td></tr>)}</tbody></table></div>
      <p>{query.data.totalElements} đăng ký · Trang {page + 1}/{Math.max(1, query.data.totalPages)}</p><button disabled={page === 0 || query.isFetching} onClick={() => setPage(p => p - 1)}>Trước</button><button disabled={page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setPage(p => p + 1)}>Sau</button>
    </>}
  </section>
}
export function StudentRegistrationDetailPage() {
  const { id } = useParams()
  const query = useStudentRegistration(Number(id))
  const location = useLocation()
  const reused = (location.state as { reused?: boolean } | null)?.reused
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) return <p role="alert">Mã đăng ký không hợp lệ.</p>
  if (query.isPending) return <p role="status">Đang tải đăng ký…</p>
  if (query.isError) return <div role="alert">{courseError(query.error)} <Link to="/student/registrations">Về đăng ký của tôi</Link></div>
  const r = query.data
  return <section className="registration-page"><Link to="/student/registrations">← Đăng ký của tôi</Link><h1>Đăng ký #{r.id}</h1>
    {reused && <p role="status">Bạn đã có đăng ký chờ thanh toán. Hệ thống mở lại đăng ký cũ, không tạo trùng.</p>}
    <article className="course-panel"><h2>{r.courseTitle}</h2><p>Trạng thái: {labels[r.status]}</p><p>Học viên: {r.fullName} · {r.email} · {r.phone ?? 'Chưa lưu'}</p><p>Gói: {r.packageName ?? 'Gói cũ chưa lưu'}{r.durationMonths ? ` (${r.durationMonths} tháng)` : ''}</p>
      <p>Giá gốc: {r.originalPrice == null ? 'Chưa lưu' : coursePrice(r.originalPrice)} · Giảm giá: {r.discountAmount == null ? 'Chưa lưu' : coursePrice(r.discountAmount)}</p><h2>Số tiền đã chốt: {coursePrice(r.amount)}</h2>
      {r.paymentPending ? <p className="registration-notice">Đã tạo đăng ký chờ thanh toán, chưa có quyền học. Module thanh toán chưa được nối; mã đăng ký #{r.id} là đầu vào để tích hợp VNPAY.</p> : <p>Hiệu lực: {r.validFrom ? new Date(r.validFrom).toLocaleString('vi-VN') : 'Chưa cấp'} → {r.lifetime && r.validFrom ? 'Vĩnh viễn' : r.validUntil ? new Date(r.validUntil).toLocaleString('vi-VN') : 'Chưa cấp'}</p>}
      <p>Giá/gói của đăng ký này không thay đổi khi Expert chỉnh giá khóa học.</p>
    </article>
  </section>
}
