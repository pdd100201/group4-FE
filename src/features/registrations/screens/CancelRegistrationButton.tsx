import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCancelRegistration } from '../../../shared/hooks/useStudentRegistrations'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import { coursePrice } from '../../courses/screens/PublicCourseCard'
import type { StudentRegistration } from '../api/registrationApi'
import './registration-cancellation.css'

function CancellationDialog({ registration, pending, error, onClose, onConfirm }: {
  registration: StudentRegistration
  pending: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const keepButton = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const active = registration.status === 'ACTIVE'
  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    keepButton.current?.focus()
    return () => {
      element?.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])
  return createPortal(<dialog ref={dialog} className="registration-cancel-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={pending}
    onCancel={event => { event.preventDefault(); if (!pending) onClose() }}>
    <div className="registration-cancel-dialog-heading">
      <span className="registration-cancel-warning-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.8 2.5 17.3A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.7L13.7 3.8a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></svg></span>
      <h2 id={titleId}>Xác nhận hủy đăng ký</h2>
      <button type="button" className="registration-cancel-dialog-close" disabled={pending} aria-label="Đóng xác nhận hủy" onClick={onClose}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    </div>
    <div className="registration-cancel-dialog-body">
      <p id={descriptionId}>Bạn có chắc muốn hủy đăng ký khóa học này?</p>
      <div className="registration-cancel-course"><strong>{registration.courseTitle}</strong><span>Đăng ký #{registration.id} · {registration.packageName ?? 'Gói học đã đăng ký'}</span><span>{active ? 'Đã thanh toán' : 'Số tiền đăng ký'}: <b>{coursePrice(registration.amount)}</b></span></div>
      <div className="registration-cancel-warning">
        <strong>{active ? 'Hủy đăng ký sẽ không được hoàn tiền' : 'Lưu ý trước khi hủy'}</strong>
        {active ? <ul><li>Bạn sẽ mất quyền học của đăng ký này ngay sau khi hủy.</li><li>Số tiền đã thanh toán sẽ không được hoàn lại khi bạn hủy đăng ký.</li><li>Nếu muốn học lại, bạn cần đăng ký và thanh toán một gói học mới.</li></ul> : <ul><li>Đăng ký sẽ chuyển sang trạng thái “Đã hủy”. Mã QR thanh toán cũ không còn hiệu lực.</li><li>Nếu đã chuyển tiền nhưng chưa được xác nhận, hãy kiểm tra giao dịch hoặc liên hệ hỗ trợ trước khi hủy.</li></ul>}
      </div>
      <p className="registration-cancel-history">Lịch sử đăng ký và thanh toán vẫn được lưu để bạn tra cứu.</p>
      {error && <p role="alert" className="registration-cancel-dialog-error">{error}</p>}
    </div>
    <div className="registration-cancel-dialog-actions"><button ref={keepButton} type="button" disabled={pending} onClick={onClose}>Giữ đăng ký</button><button type="button" className="registration-cancel-confirm" disabled={pending} onClick={onConfirm}>{pending ? 'Đang hủy đăng ký…' : 'Xác nhận hủy'}</button></div>
  </dialog>, document.body)
}

export function CancelRegistrationButton({ registration, disabled = false }: { registration: StudentRegistration; disabled?: boolean }) {
  const cancel = useCancelRegistration()
  const [confirming, setConfirming] = useState(false)
  if (registration.status !== 'PENDING_PAYMENT' && registration.status !== 'ACTIVE') return null
  return <span className="registration-cancellation">
    <button type="button" className="registration-cancel-button" aria-haspopup="dialog" disabled={disabled || cancel.isPending} onClick={() => { cancel.reset(); setConfirming(true) }}>Hủy đăng ký</button>
    {confirming && <CancellationDialog registration={registration} pending={cancel.isPending} error={cancel.isError ? courseError(cancel.error) : null}
      onClose={() => { if (!cancel.isPending) setConfirming(false) }} onConfirm={() => { if (!cancel.isPending) cancel.mutate(registration.id, { onSuccess: () => setConfirming(false) }) }} />}
  </span>
}
