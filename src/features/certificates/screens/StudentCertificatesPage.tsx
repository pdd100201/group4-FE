import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../shared/context/AuthContext'
import { certificateApi, type Certificate, type Eligibility } from '../api/certificateApi'
import { CertificateError, CertificateModal, CertificatePagination, CertificatePreview, CertificateStatus, RequirementList, certificateDate } from '../components/CertificateShared'

export function StudentCertificatesPage() {
 const { user } = useAuth()
 const client = useQueryClient()
 const [params, setParams] = useSearchParams()
 const rawId = Number(params.get('certificate'))
 const selected = Number.isSafeInteger(rawId) && rawId > 0 ? rawId : null
 const [tab, setTab] = useState<'issued' | 'conditions'>('issued')
 const [draft, setDraft] = useState('')
 const [search, setSearch] = useState('')
 const [status, setStatus] = useState('all')
 const [page, setPage] = useState(0)
 const [checkResult, setCheckResult] = useState<Eligibility | null>(null)
 const list = useQuery({ queryKey: ['certificates', user?.id, 'mine', search, status, page], queryFn: () => certificateApi.mine(search, status, page), enabled: tab === 'issued', retry: false })
 const courses = useQuery({ queryKey: ['certificates', user?.id, 'conditions', search, page], queryFn: () => certificateApi.courses(search, page), enabled: tab === 'conditions', retry: false })
 const detail = useQuery({ queryKey: ['certificates', user?.id, 'detail', selected], queryFn: () => certificateApi.detail(selected!), enabled: selected !== null, retry: false })
 const check = useMutation({ mutationFn: certificateApi.check, onSuccess: async result => {
  setCheckResult(result)
  await Promise.all([client.invalidateQueries({ queryKey: ['certificates', user?.id] }), client.invalidateQueries({ queryKey: ['notifications', user?.id] })])
 } })
 function open(id: number | null) { const next = new URLSearchParams(params); if (id === null) next.delete('certificate'); else next.set('certificate', String(id)); setParams(next, { replace: true }) }
 const query = tab === 'issued' ? list : courses
 return <main className="certificates-ui cert-page">
  <header className="cert-page-heading"><div><span className="cert-eyebrow">THÀNH QUẢ HỌC TẬP</span><h1>Chứng nhận của tôi</h1><p>Ghi nhận những khóa học bạn đã hoàn thành.</p></div><Link className="cert-button" to="/verify-certificate">Tra cứu chứng nhận</Link></header>
  <div className="cert-tabs" role="group" aria-label="Nội dung chứng nhận"><button aria-pressed={tab === 'issued'} onClick={() => { setTab('issued'); setPage(0) }}>Đã được cấp</button><button aria-pressed={tab === 'conditions'} onClick={() => { setTab('conditions'); setPage(0) }}>Kiểm tra điều kiện</button></div>
  <form className="cert-toolbar" onSubmit={event => { event.preventDefault(); setSearch(draft.trim()); setPage(0) }}>
   <input aria-label="Tìm chứng nhận hoặc khóa học" type="search" maxLength={100} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Tìm theo khóa học hoặc mã chứng nhận…" />
   {tab === 'issued' && <select aria-label="Trạng thái chứng nhận" value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}><option value="all">Tất cả trạng thái</option><option value="ISSUED">Còn hiệu lực</option><option value="REVOKED">Đã thu hồi</option></select>}
   <button className="cert-primary">Tìm kiếm</button>
  </form>
  {query.isPending && <p role="status">Đang tải…</p>}
  {query.isError && <CertificateError error={query.error} retry={() => void query.refetch()} />}
  {tab === 'issued' && list.isSuccess && <><p className="cert-muted">{list.data.totalElements} chứng nhận</p><div className="cert-grid">{list.data.content.map(c => <article className="cert-card" key={c.id}>
   <div className="cert-card-top"><span className="cert-emblem" aria-hidden="true">✓</span><CertificateStatus status={c.status} /></div>
   <h2>{c.courseTitle}</h2><p>{c.issuerName}</p><small>Ngày cấp: {certificateDate(c.issuedAt)}</small><code>{c.code}</code>
   <button onClick={() => open(c.id)}>Xem chứng nhận</button>
  </article>)}</div>{!list.data.content.length && <div className="cert-empty"><h2>Chưa có chứng nhận phù hợp</h2><p>Hoàn thành bài học và câu hỏi của từng bài học, hoặc kiểm tra điều kiện của khóa đang học.</p><button onClick={() => { setTab('conditions'); setPage(0) }}>Kiểm tra điều kiện</button></div>}</>}
  {tab === 'conditions' && courses.isSuccess && <><p className="cert-muted">Các khóa có quyền học hiện tại</p><div className="cert-grid">{courses.data.content.map(c => <article className="cert-card" key={c.courseId}>
   <h2>{c.courseTitle}</h2><p>{c.certificate ? 'Khóa học đã có chứng nhận.' : c.enabled ? 'Khóa học có cấp chứng nhận.' : 'Khóa học chưa bật cấp chứng nhận.'}</p>
   {c.enabled && !c.certificate && <p className="cert-muted">{c.lessons.filter(l => l.complete).length}/{c.lessons.length} bài học · {c.quizzes.filter(q => q.complete).length}/{c.quizzes.length} phần câu hỏi đạt</p>}
   <button disabled={check.isPending} onClick={() => c.certificate ? open(c.certificate.id) : check.mutate(c.courseId)}>{check.isPending && check.variables === c.courseId ? 'Đang kiểm tra…' : c.certificate ? 'Xem chứng nhận' : 'Kiểm tra và nhận chứng nhận'}</button>
  </article>)}</div>{!courses.data.content.length && <div className="cert-empty"><p>Bạn chưa có khóa học đang còn quyền truy cập phù hợp.</p><Link to="/student/courses">Khóa học của tôi</Link></div>}</>}
  {query.isSuccess && <CertificatePagination page={page} pages={query.data.totalPages} busy={query.isFetching} onChange={setPage} />}
  {check.isError && <CertificateError error={check.error} />}
  {checkResult && <CertificateModal title="Kết quả kiểm tra điều kiện" onClose={() => setCheckResult(null)}>
   <h3>{checkResult.courseTitle}</h3>
   {checkResult.certificate ? <><CertificateStatus status={checkResult.certificate.status} /><p>{checkResult.certificate.status === 'ISSUED' ? 'Chứng nhận đã được cấp và lưu trong tài khoản của bạn.' : 'Chứng nhận đã bị thu hồi.'}</p><button onClick={() => { open(checkResult.certificate!.id); setCheckResult(null) }}>Xem chứng nhận</button></> : <>
    <ul>{checkResult.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
    {!!checkResult.lessons.length && <RequirementList title="Bài học bắt buộc" items={checkResult.lessons} />}
    {!!checkResult.quizzes.length && <RequirementList title="Câu hỏi theo bài học" items={checkResult.quizzes} />}
   </>}
  </CertificateModal>}
  {selected !== null && <CertificateModal title="Chứng nhận hoàn thành" onClose={() => open(null)}>
   {detail.isPending && <p role="status">Đang tải chứng nhận…</p>}{detail.isError && <CertificateError error={detail.error} />}
   {detail.isSuccess && <StudentCertificateDetail certificate={detail.data} />}
  </CertificateModal>}
 </main>
}
function StudentCertificateDetail({ certificate: c }: { certificate: Certificate }) {
 const download = useMutation({ mutationFn: () => certificateApi.download(c.id, c.code) })
 return <><CertificateStatus status={c.status} /><CertificatePreview certificate={c} />
  {c.revocationReason && <p className="cert-error">Lý do thu hồi: {c.revocationReason}</p>}
  <div className="cert-actions"><button className="cert-primary" disabled={c.status !== 'ISSUED' || download.isPending} onClick={() => download.mutate()}>{download.isPending ? 'Đang tạo PDF…' : 'Tải PDF'}</button>
   <Link className="cert-button" target="_blank" rel="noreferrer" to={`/verify-certificate?code=${c.code}`}>Mở trang xác minh</Link></div>
  {download.isError && <CertificateError error={download.error} />}
 </>
}
