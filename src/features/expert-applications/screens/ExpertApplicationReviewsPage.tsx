import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expertApplicationApi, applicationStatusLabels, type ExpertApplication } from '../api/expertApplicationApi'
import { ApplicationDetails, ApplicationStatusBadge, applicationDate, applicationError } from '../components/ApplicationDetails'
import '../expert-applications.css'

export function ExpertApplicationReviewsPage() {
  const { id } = useParams()
  const applicationId = Number(id)
  const valid = id !== undefined && Number.isSafeInteger(applicationId) && applicationId > 0
  const [params, setParams] = useSearchParams()
  const rawStatus = params.get('status') ?? 'PENDING'
  const status = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'].includes(rawStatus) ? rawStatus : 'PENDING'
  const rawPage = Number(params.get('page') ?? 0)
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const search = params.get('search') ?? ''
  const [draft, setDraft] = useState(search)
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  const client = useQueryClient()
  const list = useQuery({ queryKey: ['admin-expert-applications', status, search, page],
    queryFn: () => expertApplicationApi.list(status, search, page), enabled: id === undefined, retry: false })
  const detail = useQuery({ queryKey: ['admin-expert-application', applicationId],
    queryFn: () => expertApplicationApi.detail(applicationId), enabled: valid, retry: false })
  const review = useMutation({ mutationFn: () => expertApplicationApi.review(applicationId, decision === 'approve', reason.trim()),
    onSuccess: async data => {
      client.setQueryData(['admin-expert-application', applicationId], data); setDecision(null); setReason('')
      await client.invalidateQueries({ queryKey: ['admin-expert-applications'] })
      await client.invalidateQueries({ queryKey: ['admin-accounts'] })
    } })
  function filter(event: FormEvent) { event.preventDefault(); const next = new URLSearchParams(params); next.set('search', draft.trim()); next.delete('page'); setParams(next) }
  function update(key: string, value: string) { const next = new URLSearchParams(params); next.set(key, value); if (key !== 'page') next.delete('page'); setParams(next) }
  function choose(value: 'approve' | 'reject') { review.reset(); setReason(''); setDecision(value) }
  const query = id === undefined ? list : detail
  return <section className="expert-applications-admin expert-onboarding">
    <header className="expert-application-heading"><div><span className="expert-application-eyebrow">QUẢN TRỊ GIẢNG VIÊN</span><h1>{id === undefined ? 'Hồ sơ đăng ký giảng viên' : `Hồ sơ giảng viên #${id}`}</h1><p>Xem chuyên môn và minh chứng trước khi cấp quyền giảng dạy.</p></div><button type="button" disabled={query.isFetching} onClick={() => void query.refetch()}>Làm mới</button></header>
    {id !== undefined && <Link className="expert-application-back" to={`/admin/expert-applications?${params.toString()}`}>← Quay lại danh sách</Link>}
    {id !== undefined && !valid && <p className="expert-application-error" role="alert">Mã hồ sơ không hợp lệ.</p>}
    {(id === undefined || valid) && query.isPending && <p role="status">Đang tải hồ sơ…</p>}
    {query.isError && <p className="expert-application-error" role="alert">{applicationError(query.error)}</p>}
    {id === undefined && <>
      <form className="expert-application-filters" onSubmit={filter}>
        <label>Tìm hồ sơ<input type="search" maxLength={200} placeholder="Tên, email hoặc chuyên môn…" value={draft} onChange={e => setDraft(e.target.value)} /></label>
        <label>Trạng thái<select value={status} onChange={e => update('status', e.target.value)}><option value="ALL">Tất cả</option>{Object.entries(applicationStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button className="expert-application-primary" type="submit">Tìm kiếm</button>
      </form>
      {list.data && <><p className="expert-application-muted">{list.data.totalElements} hồ sơ</p>
        {list.data.content.length ? <div className="expert-application-table-wrap"><table><thead><tr><th>Người đăng ký</th><th>Chuyên môn</th><th>Kinh nghiệm</th><th>Ngày gửi</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>{list.data.content.map(application => <ApplicationRow key={application.id} application={application} search={params.toString()} />)}</tbody></table></div>
          : <div className="expert-application-empty">Chưa có hồ sơ phù hợp.</div>}
        {list.data.totalPages > 1 && <nav className="expert-application-pagination" aria-label="Trang hồ sơ giảng viên"><button disabled={page === 0 || list.isFetching} onClick={() => update('page', String(page - 1))}>Trước</button><span>Trang {page + 1}/{list.data.totalPages}</span><button disabled={page + 1 >= list.data.totalPages || list.isFetching} onClick={() => update('page', String(page + 1))}>Sau</button></nav>}
      </>}
    </>}
    {valid && detail.data && <div className="expert-application-review-detail">
      <header className="expert-application-current-heading"><div><h2>{detail.data.applicantName}</h2><p>{detail.data.applicantEmail}{detail.data.applicantPhone && ` · ${detail.data.applicantPhone}`}</p></div><ApplicationStatusBadge application={detail.data} /></header>
      <ApplicationDetails application={detail.data} />
      {detail.data.status === 'PENDING' && <section className="expert-application-review-actions"><h2>Xét duyệt hồ sơ</h2><p>Duyệt hồ sơ sẽ thêm quyền Expert và giữ nguyên quyền Student, lịch sử đăng ký và các khóa học đã mua.</p>
        {!decision ? <div className="expert-application-actions"><button type="button" className="expert-application-primary" onClick={() => choose('approve')}>Duyệt và cấp quyền Expert</button><button type="button" className="expert-application-reject" onClick={() => choose('reject')}>Từ chối</button></div>
          : <form onSubmit={e => { e.preventDefault(); review.mutate() }}><label>{decision === 'reject' ? 'Lý do từ chối (bắt buộc)' : 'Ghi chú xét duyệt (không bắt buộc)'}<textarea rows={3} maxLength={2000} required={decision === 'reject'} value={reason} onChange={e => setReason(e.target.value)} disabled={review.isPending} /></label>
            <div className="expert-application-actions"><button type="button" disabled={review.isPending} onClick={() => setDecision(null)}>Hủy</button><button className={decision === 'approve' ? 'expert-application-primary' : 'expert-application-reject'} disabled={review.isPending || (decision === 'reject' && !reason.trim())}>{review.isPending ? 'Đang xử lý…' : decision === 'approve' ? 'Xác nhận duyệt hồ sơ' : 'Xác nhận từ chối'}</button></div>
          </form>}
      </section>}
      {review.isError && <p className="expert-application-error" role="alert">{applicationError(review.error)}</p>}
      {review.isSuccess && <p className="expert-application-success" role="status">Đã xử lý hồ sơ và gửi thông báo kết quả.</p>}
    </div>}
  </section>
}
function ApplicationRow({ application, search }: { application: ExpertApplication; search: string }) {
  return <tr><td><b>{application.applicantName}</b><small>{application.applicantEmail}</small></td><td>{application.specialty}</td><td>{application.experienceYears} năm</td><td>{applicationDate(application.submittedAt)}</td><td><ApplicationStatusBadge application={application} /></td><td><Link to={`/admin/expert-applications/${application.id}?${search}`}>Xem hồ sơ</Link></td></tr>
}
