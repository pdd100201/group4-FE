import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../shared/context/AuthContext'
import { expertApplicationApi, type ApplicationInput } from '../api/expertApplicationApi'
import { ApplicationDetails, ApplicationStatusBadge, applicationError } from './ApplicationDetails'
import '../expert-applications.css'

const empty: ApplicationInput = { specialty: '', experienceYears: 0, experience: '', introduction: '', portfolioUrl: '' }
export function ExpertApplicationSection() {
  const { user, refreshCurrentUser } = useAuth()
  const [params] = useSearchParams()
  const section = useRef<HTMLElement>(null)
  const showSection = params.get('section') === 'expert'
  const client = useQueryClient()
  const expert = !!user?.roles.includes('ROLE_EXPERT')
  const eligible = !!user?.roles.includes('ROLE_STUDENT') && !expert && !user.roles.some(role => role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ApplicationInput>(empty)
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')
  const query = useQuery({ queryKey: ['my-expert-application', user?.id], queryFn: expertApplicationApi.mine,
    enabled: eligible || expert, retry: false, refetchInterval: q => q.state.data?.status === 'PENDING' ? 15000 : false })
  const submit = useMutation({ mutationFn: () => expertApplicationApi.submit(form, files), onSuccess: data => {
    client.setQueryData(['my-expert-application', user?.id], data); setOpen(false); setFiles([])
  } })
  useEffect(() => { if (query.data?.status === 'APPROVED') void refreshCurrentUser().catch(() => {}) }, [query.data?.status, refreshCurrentUser])
  useEffect(() => { if (showSection && query.isSuccess) section.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }) }, [showSection, query.isSuccess])
  if (!eligible && !expert) return null
  const pending = query.data?.status === 'PENDING'
  function start() {
    setForm(query.data ? { specialty: query.data.specialty, experienceYears: query.data.experienceYears,
      experience: query.data.experience, introduction: query.data.introduction, portfolioUrl: query.data.portfolioUrl ?? '' } : empty)
    setFileError(''); setFiles([]); submit.reset(); setOpen(true)
  }
  function chooseFiles(selected: FileList | null) {
    const next = Array.from(selected ?? [])
    if (next.length > 3 || next.some(file => file.size > 5 * 1024 * 1024 || file.size === 0)) { setFileError('Chọn tối đa 3 tệp, mỗi tệp không quá 5 MB.'); return }
    if (next.some(file => !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type))) { setFileError('Chỉ hỗ trợ PDF, JPG, PNG hoặc WebP.'); return }
    setFileError(''); setFiles(next)
  }
  function send(event: FormEvent) { event.preventDefault(); if (!fileError) submit.mutate() }
  return <section className="expert-onboarding" id="expert-application" ref={section}>
    <header className="expert-application-heading"><div><span className="expert-application-eyebrow">GIẢNG DẠY CÙNG EDULEARN</span><h2>{expert ? 'Không gian giảng viên' : 'Đăng ký trở thành giảng viên'}</h2><p>Chia sẻ chuyên môn của bạn. Quyền học viên và các khóa học đã mua vẫn được giữ nguyên.</p></div>
      <button type="button" disabled={query.isFetching} onClick={() => void query.refetch()}>Làm mới</button></header>
    {query.isPending && <p role="status">Đang tải trạng thái hồ sơ…</p>}
    {query.isError && <p role="alert" className="expert-application-error">{applicationError(query.error)}</p>}
    {expert && <div className="expert-application-success"><p>Bạn đã có quyền Expert. Bạn có thể tạo khóa học và tiếp tục học như trước.</p><Link className="expert-application-primary" to="/expert/courses">Vào không gian giảng dạy →</Link></div>}
    {query.data && <div className="expert-application-current"><div className="expert-application-current-heading"><h3>Hồ sơ #{query.data.id}</h3><ApplicationStatusBadge application={query.data} /></div>
      {pending && <p className="expert-application-muted">Hồ sơ đang được Admin xem xét. Kết quả sẽ được gửi qua thông báo.</p>}
      <details><summary>Xem hồ sơ đã gửi</summary><ApplicationDetails application={query.data} /></details>
      {query.data.reviewReason && <div className="expert-application-reason"><b>{query.data.status === 'REJECTED' ? 'Lý do từ chối' : 'Ghi chú xét duyệt'}</b><p>{query.data.reviewReason}</p></div>}
    </div>}
    {eligible && query.isSuccess && !pending && query.data?.status !== 'APPROVED' && !open && <button className="expert-application-primary" type="button" onClick={start}>{query.data?.status === 'REJECTED' ? 'Chỉnh hồ sơ và gửi lại' : 'Đăng ký trở thành giảng viên'}</button>}
    {eligible && open && <form className="expert-application-form" onSubmit={send}>
      <p>Thông tin liên hệ lấy từ hồ sơ tài khoản của bạn. Minh chứng chỉ hiển thị cho bạn và Admin xét duyệt.</p>
      <div className="expert-application-form-grid"><label>Chuyên môn<input required minLength={3} maxLength={200} value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Ví dụ: Lập trình Java, Thiết kế UI/UX…" /></label>
        <label>Số năm kinh nghiệm<input required type="number" min={0} max={60} step={1} value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: Number(e.target.value) })} /></label></div>
      <label>Kinh nghiệm chuyên môn<textarea required minLength={20} maxLength={4000} rows={4} value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="Kinh nghiệm làm việc, dự án, thành tựu hoặc kinh nghiệm giảng dạy (ít nhất 20 ký tự)…" /></label>
      <label>Giới thiệu và định hướng giảng dạy<textarea required minLength={20} maxLength={4000} rows={4} value={form.introduction} onChange={e => setForm({ ...form, introduction: e.target.value })} placeholder="Bạn muốn dạy nội dung gì và có thể mang lại giá trị gì cho học viên? (ít nhất 20 ký tự)" /></label>
      <label>Liên kết hồ sơ / portfolio (không bắt buộc)<input type="url" pattern="https://.*" maxLength={500} placeholder="https://…" value={form.portfolioUrl} onChange={e => setForm({ ...form, portfolioUrl: e.target.value })} /></label>
      <label>Bằng cấp / chứng chỉ minh chứng (không bắt buộc)<input type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" disabled={submit.isPending} onChange={e => chooseFiles(e.target.files)} /></label>
      <small className="expert-application-muted">Tối đa 3 tệp PDF/JPG/PNG/WebP, mỗi tệp tối đa 5 MB. Gửi lại hồ sơ cần đính kèm lại tệp.</small>
      {files.length > 0 && <ul className="expert-application-selected-files">{files.map((file, i) => <li key={i}>{file.name}<button type="button" onClick={() => setFiles(files.filter((_, index) => index !== i))} disabled={submit.isPending}>Bỏ tệp</button></li>)}</ul>}
      {fileError && <p className="expert-application-error" role="alert">{fileError}</p>}
      {submit.isError && <p className="expert-application-error" role="alert">{applicationError(submit.error)}</p>}
      <div className="expert-application-actions"><button type="button" onClick={() => setOpen(false)} disabled={submit.isPending}>Hủy</button><button className="expert-application-primary" disabled={submit.isPending || !!fileError}>{submit.isPending ? 'Đang gửi hồ sơ…' : 'Gửi hồ sơ xét duyệt'}</button></div>
    </form>}
  </section>
}
