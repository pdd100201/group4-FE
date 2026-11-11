import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../shared/context/AuthContext'
import { expertStudentsApi, type ExpertRegistrationDetail } from '../api/expertStudentsApi'
import { courseError } from './ExpertCoursesPage'
import { coursePrice } from '../../courses/screens/PublicCourseCard'
import '../../registrations/screens/registrations.css'

const date = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa lưu'
const paymentLabels: Record<string, string> = { PENDING: 'Chờ thanh toán', SUCCEEDED: 'Đã thanh toán', FAILED: 'Thất bại', CANCELLED: 'Đã hủy', REFUNDED: 'Đã hoàn tiền' }
const accessLabels = { CURRENT: 'Còn hạn', EXPIRED: 'Hết hạn', UPCOMING: 'Chưa đến hạn', NOT_ACTIVATED: 'Chưa kích hoạt' }

function DetailContent({ detail }: { detail: ExpertRegistrationDetail }) {
  const r = detail.registration
  return <div className="registration-detail-content">
    <div className="registration-detail-course"><h2>{r.courseTitle}</h2><span className={`expert-students-access access-${detail.accessStatus.toLowerCase()}`}>{accessLabels[detail.accessStatus]}</span></div>
    <dl className="registration-detail-fields">
      <div><dt>Học viên</dt><dd>{r.fullName}</dd></div>
      <div><dt>Mã học viên</dt><dd>#{detail.studentId}</dd></div>
      <div><dt>Email đăng ký</dt><dd>{r.email}</dd></div>
      <div><dt>Số điện thoại đăng ký</dt><dd>{r.phone || 'Chưa lưu'}</dd></div>
      <div><dt>Mã đăng ký</dt><dd>#{r.id}</dd></div>
      <div><dt>Ngày đăng ký</dt><dd>{date(r.createdAt)}</dd></div>
      <div><dt>Gói học</dt><dd>{r.packageName ?? 'Gói cũ chưa lưu'}</dd></div>
      <div><dt>Thời lượng gói</dt><dd>{r.lifetime ? 'Vĩnh viễn' : r.durationMonths ? `${r.durationMonths} tháng` : 'Chưa lưu'}</dd></div>
      <div><dt>Giá gốc</dt><dd>{r.originalPrice == null ? 'Chưa lưu' : coursePrice(r.originalPrice)}</dd></div>
      <div><dt>Giảm giá</dt><dd>{r.discountAmount == null ? 'Chưa lưu' : coursePrice(r.discountAmount)}</dd></div>
      <div><dt>Thanh toán</dt><dd>{detail.paymentStatus ? paymentLabels[detail.paymentStatus] ?? detail.paymentStatus : 'Chưa có bản ghi'}</dd></div>
      <div><dt>Phương thức thanh toán</dt><dd>{detail.provider?.startsWith('SEPAY') ? 'QR chuyển khoản · SePay' : detail.provider === 'VNPAY' ? 'VNPay' : detail.provider ?? 'Chưa lưu'}</dd></div>
    </dl>
    <div className="registration-detail-total"><span>Tổng tiền đăng ký</span><strong>{coursePrice(r.amount)}</strong></div>
    <div className="registration-detail-validity"><h3>Thời hạn học</h3><p>Từ: {date(r.validFrom)}</p><p>Đến: {r.lifetime && r.validFrom ? 'Vĩnh viễn' : date(r.validUntil)}</p></div>
  </div>
}

export function ExpertRegistrationDetailModal({ courseId, registrationId, onClose }: { courseId: number; registrationId: number; onClose: () => void }) {
  const { user } = useAuth()
  const query = useQuery({ queryKey: ['expert-registration-detail', user?.id, courseId, registrationId], queryFn: () => expertStudentsApi.detail(courseId, registrationId), enabled: Boolean(user) })
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    return () => { element?.close(); document.body.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus() }
  }, [])
  return createPortal(<dialog ref={dialog} className="registration-detail-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="registration-detail-header"><h2 id={titleId}>Chi tiết đăng ký #{registrationId}</h2><button type="button" className="registration-detail-close" aria-label="Đóng chi tiết đăng ký" onClick={onClose}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M6 18 18 6" /></svg></button></div>
    <div className="registration-detail-body">{query.isPending ? <p role="status">Đang tải chi tiết đăng ký…</p> : query.isError ? <div role="alert"><p>{courseError(query.error)}</p><button type="button" onClick={() => void query.refetch()}>Thử lại</button></div> : <DetailContent detail={query.data} />}</div>
    <div className="registration-detail-footer"><button type="button" onClick={onClose}>Đóng</button></div>
  </dialog>, document.body)
}
