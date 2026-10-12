import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAvailableReports, useReport } from '../../../shared/hooks/useReports'
import { reportApi } from '../api/reportApi'
import type { ReportKind } from '../../../shared/types/report'
import '../../management/screens/management.css'
import './ReportsPage.css'

const names: Record<ReportKind, string> = {
  COURSES: 'Khóa học', REGISTRATIONS: 'Đăng ký', REVENUE: 'Doanh thu',
}
const statuses: Record<string, string> = {
  ACTIVE: 'Đang hoạt động', PENDING_PAYMENT: 'Chờ thanh toán', FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn', PUBLISHED: 'Đã xuất bản', DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt', REJECTED: 'Bị từ chối', ARCHIVED: 'Lưu trữ', APPROVED: 'Đã duyệt',
}
const money = (value: number | null) => value == null ? 'Chưa lưu' :
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
const date = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC',
}).format(new Date(value)) : 'Chưa lưu'
function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 403) return 'Bạn không có quyền xem báo cáo.'
    if (error.response?.status === 400) return 'Bộ lọc không hợp lệ.'
  }
  return 'Không tải được báo cáo. Vui lòng thử lại.'
}

export function ReportsPage() {
  const [params, setParams] = useSearchParams()
  const [validation, setValidation] = useState('')
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)
  const available = useAvailableReports()
  const requested = params.get('kind')
  const kind: ReportKind = requested === 'REGISTRATIONS' || requested === 'REVENUE' ? requested : 'COURSES'
  const rawPage = Number(params.get('page') ?? 0)
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const size = ['10', '20', '50'].includes(params.get('size') ?? '') ? Number(params.get('size')) : 20
  const request = new URLSearchParams(params)
  request.delete('kind')
  request.set('page', String(page))
  request.set('size', String(size))
  if (kind !== 'REGISTRATIONS') request.delete('status')
  const report = useReport(kind, request, available.data?.includes(kind) ?? false)
  const registrations = kind === 'REGISTRATIONS'

  function selectKind(nextKind: ReportKind) {
    const next = new URLSearchParams(params)
    next.set('kind', nextKind)
    next.set('page', '0')
    if (nextKind !== 'REGISTRATIONS') next.delete('status')
    setValidation(''); setExportError(''); setParams(next)
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams({ kind })
    new FormData(event.currentTarget).forEach((value, key) => {
      if (String(value).trim()) next.set(key, String(value).trim())
    })
    if (next.get('from') && next.get('to') && next.get('from')! > next.get('to')!) {
      setValidation('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'); return
    }
    setValidation(''); setExportError(''); setParams(next)
  }
  function changePage(value: number) {
    const next = new URLSearchParams(params)
    next.set('page', String(value)); setParams(next)
  }
  async function exportCsv() {
    setExporting(true); setExportError('')
    try {
      const blob = await reportApi.export(kind, request)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = `report-${kind.toLowerCase()}.csv`
      document.body.appendChild(anchor); anchor.click(); anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      let message = 'Không xuất được báo cáo. Vui lòng thử lại.'
      if (isAxiosError(error) && error.response?.status === 400)
        message = 'Kiểm tra bộ lọc; mỗi lần xuất tối đa 10.000 dòng.'
      setExportError(message)
    } finally { setExporting(false) }
  }

  const data = report.data
  return <section className="management-page reports-page">
    <header className="management-heading"><div><span className="management-brand">EduAdmin</span><h1>Báo cáo</h1></div>
      <div className="report-actions"><button onClick={() => { void available.refetch(); void report.refetch() }} disabled={report.isFetching}>Làm mới</button>
        <button onClick={exportCsv} disabled={!data || report.isFetching || exporting || Boolean(report.error)}>{exporting ? 'Đang xuất...' : 'Xuất CSV'}</button></div></header>
    {available.isLoading && <p role="status">Đang tải danh sách báo cáo...</p>}
    {available.error && <p role="alert" className="management-error">{errorMessage(available.error)}</p>}
    {available.data && <nav className="report-tabs" aria-label="Loại báo cáo">
      {available.data.map(value => <button key={value} type="button" aria-pressed={kind === value} onClick={() => selectKind(value)}>{names[value]}</button>)}
    </nav>}
    <form key={params.toString()} className="management-filters" onSubmit={apply}>
      <label>Mã khóa học<input name="courseId" type="number" min="1" step="1" defaultValue={params.get('courseId') ?? ''} /></label>
      <label>Từ ngày (UTC)<input name="from" type="date" defaultValue={params.get('from') ?? ''} /></label>
      <label>Đến ngày (UTC)<input name="to" type="date" defaultValue={params.get('to') ?? ''} /></label>
      {registrations && <label>Trạng thái<select name="status" defaultValue={params.get('status') ?? ''}><option value="">Tất cả</option>
        {['ACTIVE', 'PENDING_PAYMENT', 'FAILED', 'CANCELLED', 'EXPIRED'].map(s => <option key={s} value={s}>{statuses[s]}</option>)}</select></label>}
      <label>Số dòng<select name="size" defaultValue={size}><option>10</option><option>20</option><option>50</option></select></label>
      <div className="management-filter-actions"><button type="submit" className="primary-button">Áp dụng</button>
        <button type="button" onClick={() => { setParams({ kind }); setValidation(''); setExportError('') }}>Xóa lọc</button></div>
    </form>
    {validation && <p role="alert" className="management-error">{validation}</p>}
    {exportError && <p role="alert" className="management-error">{exportError}</p>}
    {report.isLoading && <p role="status">Đang tải báo cáo...</p>}
    {report.error && <p role="alert" className="management-error">{errorMessage(report.error)}</p>}
    {data && !report.error && <>
      <dl className="report-totals"><div><dt>{registrations ? 'Số đăng ký' : 'Số khóa học'}</dt><dd>{data.records.totalElements.toLocaleString('vi-VN')}</dd></div>
        <div><dt>{registrations ? 'Tổng tiền đăng ký' : 'Doanh thu thanh toán thành công'}</dt><dd>{money(data.totalAmount)}</dd></div></dl>
      {data.records.items.length ? <div className="management-table-wrap" aria-busy={report.isFetching}>
        <table className="management-table"><thead><tr><th>{registrations ? 'Mã đăng ký' : 'Mã khóa học'}</th><th>Khóa học</th>
          {registrations && <><th>Học viên</th><th>Ngày đăng ký (UTC)</th></>}
          {kind !== 'REVENUE' && <th>Trạng thái</th>}
          {!registrations && <th>{kind === 'COURSES' ? 'Số đăng ký' : 'Payment thành công'}</th>}
          <th>{registrations ? 'Số tiền đăng ký' : 'Doanh thu'}</th></tr></thead>
          <tbody>{data.records.items.map(row => <tr key={row.id}><td>#{row.id}</td><td>{row.courseTitle}{row.demo && <small className="report-demo">DEMO</small>}</td>
            {registrations && <><td>{row.studentName}<small>{row.studentEmail}</small></td><td>{date(row.createdAt)}</td></>}
            {kind !== 'REVENUE' && <td>{row.status ? statuses[row.status] ?? row.status : 'Chưa lưu'}</td>}
            {!registrations && <td>{row.count}</td>}<td>{money(row.amount)}</td></tr>)}</tbody>
        </table></div> : <p className="management-empty" role="status">Không có dữ liệu phù hợp.</p>}
      <nav className="management-pagination" aria-label="Phân trang báo cáo"><span>Trang {data.records.totalPages ? page + 1 : 0}/{data.records.totalPages}</span>
        <button aria-label="Trang trước" title="Trang trước" disabled={page === 0 || report.isFetching} onClick={() => changePage(page - 1)}>&lt;</button>
        <button aria-label="Trang sau" title="Trang sau" disabled={page + 1 >= data.records.totalPages || report.isFetching} onClick={() => changePage(page + 1)}>&gt;</button></nav>
    </>}
  </section>
}
