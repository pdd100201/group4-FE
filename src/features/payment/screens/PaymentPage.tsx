import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useInitiatePayment, usePayment } from '../../../shared/hooks/usePayment'
import { useStudentRegistration } from '../../../shared/hooks/useStudentRegistrations'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import { coursePrice } from '../../courses/screens/PublicCourseCard'
import type { PaymentResponse } from '../api/paymentApi'
import './payment.css'

function usePaymentCountdown(data: PaymentResponse | undefined, receivedAt: number) {
  const [now, setNow] = useState(Date.now)
  const active = data?.status === 'PENDING' && Boolean(data.expiresAt)
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [active])
  if (!data?.expiresAt) return null
  const serverNow = Date.parse(data.serverTime) + Math.max(0, now - receivedAt)
  return Math.max(0, Math.ceil((Date.parse(data.expiresAt) - serverNow) / 1000))
}

function TransferQr({ payment }: { payment: PaymentResponse }) {
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reload, setReload] = useState(0)
  const [copyStatus, setCopyStatus] = useState('')
  async function copy(value: string | null, label: string) {
    if (!value) return
    try { await navigator.clipboard.writeText(value); setCopyStatus(`Đã sao chép ${label}.`) }
    catch { setCopyStatus('Không sao chép được. Bạn có thể chọn và sao chép trực tiếp.') }
  }
  return <section className="payment-transfer" aria-label="QR chuyển khoản SePay">
    {payment.testMode && <p className="payment-test-notice">Chế độ thử nghiệm. Không quét bằng app ngân hàng thật; mô phỏng giao dịch trong SePay Test Mode.</p>}
    <div className="payment-qr-frame">
      {imageState !== 'error' && <img key={reload} src={payment.qrUrl ?? ''} alt="Mã QR chuyển khoản cho đăng ký khóa học" width="280" height="280" onLoad={() => setImageState('ready')} onError={() => setImageState('error')} />}
      {imageState === 'loading' && <span role="status">Đang tải mã QR…</span>}
      {imageState === 'error' && <div role="alert">Không tải được ảnh QR.<button type="button" onClick={() => { setImageState('loading'); setReload(value => value + 1) }}>Tải lại QR</button></div>}
    </div>
    <dl className="payment-bank-details"><dt>Ngân hàng</dt><dd>{payment.bank}</dd><dt>Chủ tài khoản</dt><dd>{payment.accountHolder}</dd>
      <dt>Tài khoản nhận</dt><dd><span>{payment.accountNumber}</span><button type="button" onClick={() => void copy(payment.accountNumber, 'số tài khoản')}>Sao chép</button></dd>
      <dt>Nội dung</dt><dd><strong>{payment.transferContent}</strong><button type="button" onClick={() => void copy(payment.transferContent, 'nội dung chuyển khoản')}>Sao chép</button></dd>
    </dl><p className="payment-copy-status" role="status">{copyStatus}</p>
    <p className="payment-note">Giữ nguyên số tiền và nội dung chuyển khoản. Quyền học chỉ được cấp sau khi SePay xác nhận giao dịch.</p>
  </section>
}

export function PaymentPage() {
  const { id } = useParams()
  const registrationId = Number(id)
  const registration = useStudentRegistration(registrationId)
  const payment = usePayment(registrationId, true)
  const initiate = useInitiatePayment(registrationId)
  const remaining = usePaymentCountdown(payment.data, payment.dataUpdatedAt)
  const locallyExpired = payment.data?.status === 'PENDING' && remaining === 0
  useEffect(() => {
    if (locallyExpired) void payment.refetch()
  }, [locallyExpired, payment.refetch])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [registrationId])
  if (!Number.isSafeInteger(registrationId) || registrationId <= 0) return <section className="payment-page" role="alert">Mã đăng ký không hợp lệ.</section>
  if (registration.isPending || payment.isPending) return <section className="payment-page" role="status">Đang tải thanh toán…</section>
  if (registration.isError || payment.isError) return <section className="payment-page" role="alert">{courseError(registration.error ?? payment.error)} <button onClick={() => { void registration.refetch(); void payment.refetch() }}>Thử lại</button></section>
  const r = registration.data
  const current = payment.data
  const paid = current.status === 'SUCCEEDED'
  const expired = current.expired || locallyExpired
  const canPay = r.status === 'PENDING_PAYMENT' && current.status === 'PENDING'
  return <section className="payment-page"><Link to={`/courses/${r.courseId}`}>← Thông tin khóa học</Link><h1>Thanh toán khóa học</h1>
    <div className="payment-grid"><section className="payment-info"><h2>Thông tin đăng ký</h2><h3>{r.courseTitle}</h3><dl>
      <dt>Mã đăng ký</dt><dd>#{r.id}</dd><dt>Học viên</dt><dd>{r.fullName}</dd><dt>Email</dt><dd>{r.email}</dd><dt>Số điện thoại</dt><dd>{r.phone ?? 'Chưa lưu'}</dd><dt>Gói học</dt><dd>{r.packageName}</dd>
    </dl><Link to={`/student/registrations/${r.id}`}>Chi tiết đăng ký</Link></section>
    <aside className="payment-summary"><h2>Tổng thanh toán</h2><dl><dt>Giá gốc</dt><dd>{r.originalPrice == null ? 'Chưa lưu' : coursePrice(r.originalPrice)}</dd><dt>Giảm giá</dt><dd>{r.discountAmount == null ? 'Chưa lưu' : coursePrice(r.discountAmount)}</dd></dl>
      <p className="payment-total">{coursePrice(r.amount)}</p><p>Phương thức: QR chuyển khoản · SePay</p>
      {paid ? <div role="status" className="payment-success"><p>Giao dịch đã được xác nhận.</p><Link to={`/student/registrations/${r.id}`}>Xem đăng ký</Link></div> : expired ? <div className="payment-expired" role="status">
        <h3>Đã hết thời gian thanh toán</h3><p>Yêu cầu thanh toán đã hết hạn sau 5 phút. Không chuyển tiền theo mã QR cũ.</p>
        <Link className="course-primary" to={r.packageId ? `/student/courses/${r.courseId}/register?packageId=${r.packageId}` : `/courses/${r.courseId}`}>Đăng ký lại</Link>
        <p>Nếu đã chuyển tiền nhưng chưa được xác nhận, hãy liên hệ hỗ trợ để đối soát.</p>
      </div> : canPay ? <>
        {remaining !== null && <p className="payment-countdown" role="timer" aria-label="Thời gian thanh toán còn lại">Thời gian còn lại <strong>{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</strong></p>}
        {!current.configured ? <p role="alert" className="course-error">Chưa cấu hình tài khoản nhận tiền và khóa webhook SePay trên backend.</p> : current.qrUrl ? <TransferQr key={current.qrUrl} payment={current} /> : <>
          {current.testMode && <p className="payment-test-notice">SePay Test Mode · Chỉ mô phỏng, không chuyển tiền thật.</p>}
          <button className="course-primary payment-pay" disabled={initiate.isPending} onClick={() => { void initiate.mutateAsync().catch(() => {}) }}>{initiate.isPending ? 'Đang tạo mã QR…' : 'Hiện mã QR thanh toán'}</button>
        </>}
        {current.qrUrl && <div className="payment-waiting"><p role="status">Đang chờ SePay xác nhận…</p><button type="button" disabled={payment.isFetching} onClick={() => void payment.refetch()}>Kiểm tra giao dịch</button></div>}
      </> : <p>Đăng ký này không còn ở trạng thái chờ thanh toán.</p>}
      {initiate.isError && <p role="alert" className="course-error">{courseError(initiate.error)}</p>}
    </aside></div></section>
}

export function PaymentResultPage() {
  const [params] = useSearchParams()
  const id = Number(params.get('registrationId'))
  const payment = usePayment(id, true)
  // Neither the URL nor a Student's confirmation button can mark a transfer paid.
  const state = payment.data?.status
  return <section className="payment-page payment-result"><h1>Kết quả thanh toán</h1>
    {!Number.isSafeInteger(id) || id <= 0 ? <p role="alert">Mã đăng ký không hợp lệ.</p> : payment.isPending ? <p role="status">Đang kiểm tra giao dịch…</p> : payment.isError ? <><p role="alert">{courseError(payment.error)}</p><button onClick={() => void payment.refetch()}>Thử lại</button></> : <>
      <p role="status" className={state === 'SUCCEEDED' ? 'payment-success' : ''}>{state === 'SUCCEEDED' ? 'Giao dịch đã được xác nhận.' : payment.data.expired ? 'Yêu cầu thanh toán đã hết hạn sau 5 phút. Không chuyển tiền theo mã QR cũ.' : state === 'PENDING' ? 'Đang chờ xác nhận giao dịch. Chưa cấp quyền học.' : 'Thanh toán chưa hoàn tất hoặc không còn khả dụng.'}</p>
      {state === 'PENDING' && <button onClick={() => void payment.refetch()}>Kiểm tra lại</button>}
      <div className="payment-result-links"><Link to={`/student/registrations/${id}`}>Xem đăng ký</Link>{state === 'PENDING' && <Link to={`/student/registrations/${id}/payment`}>Về trang thanh toán</Link>}<Link to="/courses">Khám phá khóa học</Link></div>
    </>}
  </section>
}
