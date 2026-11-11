import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useStudentRegistration } from '../../../shared/hooks/useStudentRegistrations'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import { coursePrice } from '../../courses/screens/PublicCourseCard'
import type { StudentRegistration } from '../api/registrationApi'
import { CancelRegistrationButton } from './CancelRegistrationButton'

const labels: Record<StudentRegistration['status'], string> = { PENDING_PAYMENT: 'Chờ thanh toán', ACTIVE: 'Đang hoạt động', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn', FAILED: 'Thất bại' }
const date = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa cấp'

export function RegistrationDetails({ registration: r }: { registration: StudentRegistration }) {
  return <div className="registration-detail-content">
    <div className="registration-detail-course"><h2>{r.courseTitle}</h2><span className={`registration-detail-status registration-detail-status-${r.status.toLowerCase()}`}>{labels[r.status]}</span></div>
    <dl className="registration-detail-fields">
      <div><dt>Mã đăng ký</dt><dd>#{r.id}</dd></div>
      <div><dt>Ngày đăng ký</dt><dd>{r.createdAt ? date(r.createdAt) : 'Chưa lưu'}</dd></div>
      <div><dt>Học viên</dt><dd>{r.fullName}</dd></div>
      <div><dt>Email</dt><dd>{r.email}</dd></div>
      <div><dt>Số điện thoại</dt><dd>{r.phone ?? 'Chưa lưu'}</dd></div>
      <div><dt>Gói học</dt><dd>{r.packageName ?? 'Gói cũ chưa lưu'}{r.durationMonths ? ` (${r.durationMonths} tháng)` : ''}</dd></div>
      <div><dt>Giá gốc</dt><dd>{r.originalPrice == null ? 'Chưa lưu' : coursePrice(r.originalPrice)}</dd></div>
      <div><dt>Giảm giá</dt><dd>{r.discountAmount == null ? 'Chưa lưu' : coursePrice(r.discountAmount)}</dd></div>
    </dl>
    <div className="registration-detail-total"><span>Tổng tiền</span><strong>{coursePrice(r.amount)}</strong></div>
    {(r.status === 'PENDING_PAYMENT' || r.status === 'ACTIVE') && <CancelRegistrationButton registration={r} />}
    {r.status === 'CANCELLED' && <p className="registration-notice">Đăng ký đã được hủy. Quyền học của đăng ký này đã dừng.</p>}
    {r.paymentPending ? <p className="registration-notice">Đăng ký đang chờ thanh toán, chưa có quyền học. <Link to={`/student/registrations/${r.id}/payment`}>Tiếp tục thanh toán QR →</Link></p> : <div className="registration-detail-validity"><h3>{r.status === 'CANCELLED' ? 'Thời hạn đã đăng ký' : 'Thời hạn học'}</h3><p>Từ: {date(r.validFrom)}</p><p>Đến: {r.lifetime && r.validFrom ? 'Vĩnh viễn' : date(r.validUntil)}</p></div>}
  </div>
}

export function RegistrationDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const query = useStudentRegistration(id)
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    return () => { element?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus() }
  }, [])
  return <dialog ref={dialog} className="registration-detail-dialog" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose() } }}>
    <header className="registration-detail-header"><h2 id={titleId}>Chi tiết đăng ký #{id}</h2><button type="button" className="registration-detail-close" aria-label="Đóng chi tiết đăng ký" onClick={onClose}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M6 18 18 6" /></svg></button></header>
    <div className="registration-detail-body">
      {query.isPending ? <p role="status">Đang tải chi tiết đăng ký…</p> : query.isError ? <div role="alert"><p>{courseError(query.error)}</p><button type="button" onClick={() => void query.refetch()}>Thử lại</button></div> : <RegistrationDetails registration={query.data} />}
    </div>
    <div className="registration-detail-footer"><button type="button" onClick={onClose}>Đóng</button></div>
  </dialog>
}
