import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../shared/context/AuthContext'
import { certificateApi, managementBase, type CourseOption, type PolicyOptions } from '../api/certificateApi'
import { CertificateError, CertificateModal, CertificatePagination, CertificatePreview, CertificateStatus, certificateDate } from '../components/CertificateShared'

export function ManageCertificatesPage() {
 const { user } = useAuth()
 const base = managementBase(!!user?.roles.includes('ROLE_ADMIN'))
 const [params, setParams] = useSearchParams()
 const tab = params.get('tab') === 'policy' ? 'policy' : 'certificates'
 const [draft, setDraft] = useState('')
 const [search, setSearch] = useState('')
 const [status, setStatus] = useState('all')
 const [page, setPage] = useState(0)
 const [course, setCourse] = useState<CourseOption | null>(null)
 const [selected, setSelected] = useState<number | null>(null)
 const list = useQuery({ queryKey: ['manage-certificates', user?.id, base, search, status, course?.id, page],
  queryFn: () => certificateApi.list(base, search, status, course?.id, page), enabled: tab === 'certificates', retry: false })
 return <main className="certificates-ui cert-page">
  <header className="cert-page-heading"><div><span className="cert-eyebrow">QUẢN LÝ ĐÀO TẠO</span><h1>Chứng nhận hoàn thành</h1><p>Cấu hình điều kiện cấp và quản lý vòng đời chứng nhận.</p></div></header>
  <div className="cert-tabs" role="group" aria-label="Quản lý chứng nhận"><button aria-pressed={tab === 'certificates'} onClick={() => setParams({})}>Chứng nhận đã cấp</button><button aria-pressed={tab === 'policy'} onClick={() => setParams({ tab: 'policy' })}>Điều kiện cấp theo khóa</button></div>
  {tab === 'certificates' ? <>
   <form className="cert-toolbar" onSubmit={e => { e.preventDefault(); setSearch(draft.trim()); setPage(0) }}>
    <input type="search" aria-label="Tìm chứng nhận" maxLength={100} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Tên học viên, khóa học hoặc mã chứng nhận…" />
    <select aria-label="Trạng thái" value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}><option value="all">Tất cả trạng thái</option><option value="ISSUED">Còn hiệu lực</option><option value="REVOKED">Đã thu hồi</option></select><button className="cert-primary">Tìm kiếm</button>
   </form>
   <details className="cert-course-filter"><summary>Lọc theo khóa học{course ? `: ${course.title}` : ''}</summary><CoursePicker base={base} selected={course?.id} onSelect={value => { setCourse(value); setPage(0) }} />{course && <button onClick={() => { setCourse(null); setPage(0) }}>Bỏ lọc khóa học</button>}</details>
   {list.isPending && <p role="status">Đang tải chứng nhận…</p>}{list.isError && <CertificateError error={list.error} retry={() => void list.refetch()} />}
   {list.isSuccess && <><p className="cert-muted">{list.data.totalElements} chứng nhận</p>
    <div className="cert-table-wrap"><table><caption className="cert-sr-only">Danh sách chứng nhận hoàn thành</caption><thead><tr><th>Học viên / Mã</th><th>Khóa học</th><th>Ngày cấp</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{list.data.content.map(c => <tr key={c.id}><td><b>{c.studentName}</b><code>{c.code}</code></td><td>{c.courseTitle}<small>Điều kiện v{c.policyVersion}</small></td><td>{certificateDate(c.issuedAt)}</td><td><CertificateStatus status={c.status} /></td><td><button onClick={() => setSelected(c.id)}>Xem / Quản lý</button></td></tr>)}</tbody></table></div>
    {!list.data.content.length && <p className="cert-empty">Không có chứng nhận phù hợp.</p>}
    <CertificatePagination page={page} pages={list.data.totalPages} busy={list.isFetching} onChange={setPage} />
   </>}
  </> : <section className="cert-panel">
   <h2>Khóa học đủ điều kiện cấp chứng nhận</h2>
   <CoursePicker key="policy" base={base} />
  </section>}
  {selected !== null && <CertificateModal title="Quản lý chứng nhận" onClose={() => setSelected(null)}><ManagementDetail key={selected} base={base} id={selected} /></CertificateModal>}
 </main>
}
export function CertificatePolicyPage() {
 const { user } = useAuth()
 const base = managementBase(!!user?.roles.includes('ROLE_ADMIN'))
 const id = Number(useParams().courseId)

 return <main className="certificates-ui cert-page">
  <header className="cert-page-heading"><h1>Cấu hình cấp chứng nhận</h1></header>
  <Link to="../../..?tab=policy" relative="path">← Quay lại danh sách khóa học</Link>
  {Number.isSafeInteger(id) && id > 0
   ? <PolicyPanel key={id} base={base} courseId={id} />
   : <p className="cert-error" role="alert">Mã khóa học không hợp lệ.</p>}
 </main>
}

function CoursePicker({ base, selected, onSelect }: { base: string; selected?: number; onSelect?: (course: CourseOption) => void }) {
 const { user } = useAuth()
 const [draft, setDraft] = useState('')
 const [search, setSearch] = useState('')
 const [page, setPage] = useState(0)
 const eligibleOnly = !onSelect
 const query = useQuery({ queryKey: ['certificate-course-options', user?.id, base, search, page, eligibleOnly], queryFn: () => certificateApi.options(base, search, page, eligibleOnly), retry: false })
 return <div className="cert-course-picker"><form className="cert-toolbar" onSubmit={e => { e.preventDefault(); setSearch(draft.trim()); setPage(0) }}><input type="search" maxLength={100} aria-label="Tìm khóa để cấu hình" placeholder="Tìm khóa học…" value={draft} onChange={e => setDraft(e.target.value)} /><button>Tìm khóa</button></form>
  {query.isPending && <p role="status">Đang tải khóa học…</p>}{query.isError && <CertificateError error={query.error} />}
  {query.isSuccess && <><ul>{query.data.content.map(course => <li key={course.id}>{onSelect
    ? <button aria-pressed={selected === course.id} onClick={() => onSelect(course)}><strong>{course.title}</strong><small>{course.expertName} · {course.status}</small></button>
    : <Link to={'courses/' + course.id + '/policy'}><strong>{course.title}</strong><small>{course.expertName} · {course.status}</small></Link>}</li>)}</ul>
   {!query.data.content.length && <p>{eligibleOnly ? 'Không tìm thấy khóa học đủ điều kiện.' : 'Không tìm thấy khóa học.'}</p>}<CertificatePagination page={page} pages={query.data.totalPages} busy={query.isFetching} onChange={setPage} /></>}
 </div>
}
function PolicyPanel({ base, courseId }: { base: string; courseId: number }) {
 const { user } = useAuth()
 const [notice, setNotice] = useState('')
 const query = useQuery({ queryKey: ['certificate-policy', user?.id, base, courseId], queryFn: () => certificateApi.policy(base, courseId), retry: false })
 return <section className="cert-panel"><h2>Điều kiện cấp chứng nhận</h2>
  {notice && <p className="cert-success" role="status">{notice}</p>}
  {query.isPending && <p role="status">Đang tải cấu hình…</p>}{query.isError && <CertificateError error={query.error} />}
  {query.isSuccess && <><PolicyEditor key={query.data.current?.id ?? 'new'} base={base} options={query.data} onSaved={() => setNotice('Đã lưu phiên bản điều kiện mới. Chứng nhận đã cấp giữ nguyên thông tin.')} />
   <details className="cert-policy-history"><summary>Lịch sử 10 phiên bản gần nhất</summary>{query.data.history.map(policy => <article key={policy.id}><b>Phiên bản {policy.version} · {policy.enabled ? 'Bật' : 'Tắt'}</b><p>{policy.issuerName} · {policy.lessons.length} bài học · {policy.quizzes.length} quiz</p><small>{policy.configuredBy} · {certificateDate(policy.createdAt)}</small></article>)}</details>
  </>}
 </section>
}
function PolicyEditor({ base, options, onSaved }: { base: string; options: PolicyOptions; onSaved: () => void }) {
 const { user } = useAuth()
 const client = useQueryClient()
 const [enabled, setEnabled] = useState(options.current?.enabled ?? false)
 const [issuer, setIssuer] = useState(options.current?.issuerName ?? 'EduLearn')
 const [selected, setSelected] = useState<number[]>(options.current
  ? options.current.quizzes.filter(item => options.quizzes.some(q => q.id === item.id && q.complete)).map(item => item.id)
  : options.quizzes.filter(q => q.complete).map(q => q.id))
 const save = useMutation({ mutationFn: () => certificateApi.savePolicy(base, options.courseId, { enabled, issuerName: issuer.trim(), quizIds: selected, expectedVersion: options.current?.version ?? 0 }),
  onSuccess: async () => { onSaved(); await client.invalidateQueries({ queryKey: ['certificate-policy', user?.id, base, options.courseId] }) } })
 const valid = issuer.trim() && (!enabled || (options.courseStatus === 'PUBLISHED' && options.lessons.length > 0 && selected.length > 0))
 return <form onSubmit={e => { e.preventDefault(); if (valid && !save.isPending) save.mutate() }}>
  <h3>{options.courseTitle}</h3><p className="cert-muted">Mỗi lần lưu tạo một phiên bản mới cho nội dung hiện tại. Tất cả bài học đang hoạt động đều là bắt buộc.</p>
  <fieldset disabled={save.isPending}>
   <label className="cert-checkbox"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Bật cấp chứng nhận</label>
   <label className="cert-field">Đơn vị cấp<input required maxLength={160} value={issuer} onChange={e => setIssuer(e.target.value)} /></label>
   {enabled && options.courseStatus !== 'PUBLISHED' && <p className="cert-error">Chỉ bật cấp khi khóa học đã được xuất bản.</p>}
   <h4>Bài học bắt buộc ({options.lessons.length})</h4><ul>{options.lessons.map(l => <li key={l.id}>{l.title}</li>)}</ul>
   <h4>Chọn quiz bắt buộc</h4><p className="cert-muted">Cần ít nhất một quiz hợp lệ. Quiz bị ẩn hoặc thiếu cấu hình không thể được chọn.</p>
   {options.quizzes.map(q => <label className="cert-checkbox" key={q.id}><input type="checkbox" disabled={!q.complete} checked={selected.includes(q.id)} onChange={e => setSelected(ids => e.target.checked ? [...ids, q.id] : ids.filter(id => id !== q.id))} />{q.title}{!q.complete && <small> — Chưa sẵn sàng</small>}</label>)}
   {!options.quizzes.length && <p>Khóa học chưa có quiz.</p>}
   <button className="cert-primary" disabled={!valid || save.isPending}>{save.isPending ? 'Đang lưu…' : 'Lưu phiên bản điều kiện'}</button>
  </fieldset>
  {save.isError && <CertificateError error={save.error} />}
 </form>
}
function ManagementDetail({ base, id }: { base: string; id: number }) {
 const { user } = useAuth()
 const client = useQueryClient()
 const [reason, setReason] = useState('')
 const [showRevoke, setShowRevoke] = useState(false)
 const [page, setPage] = useState(0)
 const detail = useQuery({ queryKey: ['managed-certificate-detail', user?.id, base, id], queryFn: () => certificateApi.managedDetail(base, id), retry: false })
 const history = useQuery({ queryKey: ['certificate-audit', user?.id, base, id, page], queryFn: () => certificateApi.audit(base, id, page), retry: false })
 const download = useMutation({ mutationFn: () => certificateApi.download(id, detail.data!.code, base) })
 const revoke = useMutation({ mutationFn: () => certificateApi.revoke(base, id, reason.trim()), onSuccess: async () => {
  setReason(''); setShowRevoke(false); setPage(0)
  await Promise.all([client.invalidateQueries({ queryKey: ['manage-certificates', user?.id] }), client.invalidateQueries({ queryKey: ['managed-certificate-detail', user?.id, base, id] }), client.invalidateQueries({ queryKey: ['certificate-audit', user?.id, base, id] })])
 } })
 return <>
  {detail.isPending && <p role="status">Đang tải…</p>}{detail.isError && <CertificateError error={detail.error} />}
  {detail.isSuccess && <><CertificateStatus status={detail.data.status} /><CertificatePreview certificate={detail.data} />
   <p className="cert-muted">Được cấp theo điều kiện phiên bản {detail.data.policyVersion}.</p>
   {detail.data.revocationReason && <p className="cert-error">Lý do thu hồi: {detail.data.revocationReason}</p>}
   <div className="cert-actions"><button disabled={detail.data.status !== 'ISSUED' || download.isPending} onClick={() => download.mutate()}>Tải PDF</button>
    {detail.data.status === 'ISSUED' && <button className="cert-danger" disabled={revoke.isPending} onClick={() => setShowRevoke(value => !value)}>{showRevoke ? 'Hủy thao tác' : 'Thu hồi chứng nhận'}</button>}</div>
   {download.isError && <CertificateError error={download.error} />}
   {showRevoke && <form className="cert-revoke-form" onSubmit={e => { e.preventDefault(); if (reason.trim() && !revoke.isPending) revoke.mutate() }}><p>Thu hồi sẽ làm chứng nhận mất hiệu lực khi tra cứu. Thao tác được lưu trong lịch sử.</p><label className="cert-field">Lý do thu hồi<textarea required rows={3} maxLength={500} disabled={revoke.isPending} value={reason} onChange={e => setReason(e.target.value)} /></label><button className="cert-danger" disabled={revoke.isPending || !reason.trim()}>{revoke.isPending ? 'Đang thu hồi…' : 'Xác nhận thu hồi'}</button></form>}
   {revoke.isError && <CertificateError error={revoke.error} />}
  </>}
  <section className="cert-audit"><h3>Lịch sử chứng nhận</h3>{history.isPending && <p>Đang tải lịch sử…</p>}{history.isError && <CertificateError error={history.error} />}
   {history.isSuccess && <><ul>{history.data.content.map(a => <li key={a.id}><b>{a.action === 'ISSUED' ? 'Cấp chứng nhận' : 'Thu hồi'}</b><span>{a.actorName} · {new Date(a.occurredAt).toLocaleString('vi-VN')}</span>{a.reason && <p>{a.reason}</p>}</li>)}</ul><CertificatePagination page={page} pages={history.data.totalPages} busy={history.isFetching} onChange={setPage} /></>}
  </section>
 </>
}
