import { useEffect, useRef, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import type { PublicCertificate, Requirement } from '../api/certificateApi'
import './certificates.css'
export const certificateDate = (date: string) => new Date(date).toLocaleDateString('vi-VN')
export function CertificateError({ error, retry }: { error: unknown; retry?: () => void }) {
 const message = isAxiosError(error) && typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Không thực hiện được thao tác. Vui lòng thử lại.'
 return <div className="cert-error" role="alert"><p>{message}</p>{retry && <button type="button" onClick={retry}>Thử lại</button>}</div>
}
export function CertificateStatus({ status }: { status: string }) {
 return <span className={`cert-badge ${status === 'ISSUED' ? 'valid' : 'revoked'}`}>{status === 'ISSUED' ? 'Còn hiệu lực' : 'Đã thu hồi'}</span>
}
export function CertificatePreview({ certificate: c }: { certificate: PublicCertificate }) {
 return <section className={`cert-preview ${c.status === 'REVOKED' ? 'cert-preview-revoked' : ''}`} aria-label="Thông tin chứng nhận">
  <div className="cert-preview-content">
   <div className="cert-preview-brand">EduLearn</div>
   <p className="cert-preview-date">Ngày cấp {certificateDate(c.issuedAt)}</p>
   <strong className="cert-preview-name">{c.studentName}</strong>
   <p>Đã hoàn thành khóa học</p>
   <h3>{c.courseTitle}</h3>
   <div className="cert-preview-issuer"><b>{c.issuerName}</b><small>Đơn vị cấp chứng chỉ</small></div>
  </div>
  <div className="cert-preview-side">
   <div className="cert-preview-ribbon">
    <h2>CHỨNG CHỈ<span>HOÀN THÀNH KHÓA HỌC</span></h2>
    <div className="cert-preview-seal" aria-hidden="true"><b>EDULEARN</b><small>CHỨNG NHẬN</small></div>
   </div>
   <div className="cert-preview-code"><small>Mã chứng chỉ</small><code>{c.code}</code></div>
  </div>
  {c.status === 'REVOKED' && <p className="cert-revoked-note">Chứng nhận đã bị thu hồi{c.revokedAt ? ` ngày ${certificateDate(c.revokedAt)}` : ''}.</p>}
 </section>
}
export function CertificateModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
 const dialog = useRef<HTMLDialogElement>(null)
 useEffect(() => {
  const element = dialog.current
  const previous = document.activeElement as HTMLElement | null
  element?.showModal()
  return () => { element?.close(); previous?.focus() }
 }, [])
 return <dialog className="cert-modal certificates-ui" ref={dialog} onCancel={onClose}>
  <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Đóng">×</button></header>
  {children}
 </dialog>
}
export function CertificatePagination({ page, pages, busy, onChange }: { page: number; pages: number; busy: boolean; onChange: (page: number) => void }) {
 if (pages <= 1 && page === 0) return null
 return <nav className="cert-pagination" aria-label="Phân trang"><button disabled={busy || page === 0} onClick={() => onChange(page - 1)}>Trước</button><span>Trang {page + 1}/{Math.max(1, pages, page + 1)}</span><button disabled={busy || page + 1 >= pages} onClick={() => onChange(page + 1)}>Sau</button></nav>
}
export function RequirementList({ title, items }: { title: string; items: Requirement[] }) {
 return <section className="cert-requirements"><h4>{title} ({items.filter(item => item.complete).length}/{items.length})</h4><ul>{items.map(item => <li key={item.id}><span aria-label={item.complete ? 'Đã đạt' : 'Chưa đạt'}>{item.complete ? '✓' : '○'}</span>{item.title}</li>)}</ul></section>
}
