import { useState } from 'react'
import { isAxiosError } from 'axios'
import { expertApplicationApi, applicationStatusLabels, type ExpertApplication } from '../api/expertApplicationApi'

export function applicationError(error: unknown): string {
  return isAxiosError<{ message?: string }>(error) && error.response?.data?.message
    ? error.response.data.message : 'Không thể xử lý hồ sơ. Vui lòng thử lại.'
}
export const applicationDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
export function ApplicationStatusBadge({ application }: { application: ExpertApplication }) {
  return <span className={`expert-application-status status-${application.status.toLowerCase()}`}>{applicationStatusLabels[application.status]}</span>
}
export function ApplicationDetails({ application }: { application: ExpertApplication }) {
  const [downloading, setDownloading] = useState<number | null>(null)
  const [error, setError] = useState('')
  async function download(document: ExpertApplication['documents'][number]) {
    setError(''); setDownloading(document.id)
    try { await expertApplicationApi.download(document) } catch (cause) { setError(applicationError(cause)) } finally { setDownloading(null) }
  }
  return <div className="expert-application-details">
    <dl><div><dt>Chuyên môn</dt><dd>{application.specialty}</dd></div><div><dt>Kinh nghiệm</dt><dd>{application.experienceYears} năm</dd></div>
      <div><dt>Ngày gửi</dt><dd>{applicationDate(application.submittedAt)}</dd></div>
      {application.reviewedAt && <div><dt>Ngày xử lý</dt><dd>{applicationDate(application.reviewedAt)}{application.reviewerName && ` · ${application.reviewerName}`}</dd></div>}
    </dl>
    <h3>Kinh nghiệm chuyên môn</h3><p className="expert-application-text">{application.experience}</p>
    <h3>Giới thiệu và định hướng giảng dạy</h3><p className="expert-application-text">{application.introduction}</p>
    {application.portfolioUrl && <p><a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer">Xem hồ sơ / portfolio ↗</a></p>}
    <h3>Minh chứng đính kèm</h3>
    {application.documents.length ? <ul className="expert-application-documents">{application.documents.map(document => <li key={document.id}>
      <span>{document.name}<small>{(document.sizeBytes / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} KB</small></span>
      <button type="button" disabled={downloading !== null} onClick={() => void download(document)}>{downloading === document.id ? 'Đang tải…' : 'Tải xuống'}</button>
    </li>)}</ul> : <p className="expert-application-muted">Không có tệp minh chứng.</p>}
    {error && <p className="expert-application-error" role="alert">{error}</p>}
    {application.reviewReason && <div className={`expert-application-reason ${application.status === 'REJECTED' ? 'rejected' : ''}`}><b>{application.status === 'REJECTED' ? 'Lý do từ chối' : 'Ghi chú xét duyệt'}</b><p>{application.reviewReason}</p></div>}
  </div>
}
