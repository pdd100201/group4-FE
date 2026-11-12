import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAvailableReports, useReport } from '../../../shared/hooks/useReports'
import { reportApi } from '../api/reportApi'
import type { ReportKind } from '../../../shared/types/report'
import { ReportChart } from '../../../shared/components/report-chart/ReportChart'
import '../../management/screens/management.css'
import './ReportsPage.css'

const sections = [{ kind: 'REVENUE', label: 'Tài chính & Doanh thu' }, { kind: 'COURSES', label: 'Khóa học & Nội dung' }] as const
const statuses: Record<string, string> = { PUBLISHED: 'Đã xuất bản', DRAFT: 'Bản nháp', PENDING_REVIEW: 'Chờ duyệt', REJECTED: 'Bị từ chối', ARCHIVED: 'Lưu trữ', APPROVED: 'Đã duyệt' }
const money = (value: number | null) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0)
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
 const kind: ReportKind = params.get('kind') === 'COURSES' ? 'COURSES' : 'REVENUE'
 const finance = kind === 'REVENUE'
 const rawPage = Number(params.get('page') ?? 0)
 const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
 const size = ['10', '20', '50'].includes(params.get('size') ?? '') ? Number(params.get('size')) : 20
 const request = new URLSearchParams()
 for (const key of ['courseId', 'from', 'to']) { const value = params.get(key); if (value) request.set(key, value) }
 request.set('page', String(page)); request.set('size', String(size))
 const report = useReport(kind, request, available.data?.includes(kind) ?? false)
 const data = report.data, metrics = data?.metrics ?? {}
 const reportReturnTo = `/admin/reports?${new URLSearchParams({ ...Object.fromEntries(request), kind })}`
 function selectKind(value: ReportKind) {
  const next = new URLSearchParams(params)
  next.set('kind', value); next.set('page', '0'); next.delete('status'); next.delete('from'); next.delete('to')
  setValidation(''); setExportError(''); setParams(next)
 }
 function apply(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const next = new URLSearchParams({ kind })
  new FormData(event.currentTarget).forEach((value, key) => { if (String(value).trim()) next.set(key, String(value).trim()) })
  if (next.get('courseId') && (!Number.isSafeInteger(Number(next.get('courseId'))) || Number(next.get('courseId')) <= 0)) { setValidation('Mã khóa học phải là số nguyên dương.'); return }
  if (next.get('from') && next.get('to') && next.get('from')! > next.get('to')!) { setValidation('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'); return }
  setValidation(''); setExportError(''); setParams(next)
 }
 function changePage(value: number) { const next = new URLSearchParams(request); next.set('kind', kind); next.set('page', String(value)); setParams(next) }
 async function exportCsv() {
  setExporting(true); setExportError('')
  try {
   const blob = await reportApi.export(kind, request)
   const url = URL.createObjectURL(blob), anchor = document.createElement('a')
   anchor.href = url; anchor.download = finance ? 'bao-cao-tai-chinh-doanh-thu.csv' : 'bao-cao-khoa-hoc-noi-dung.csv'
   document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) { setExportError(isAxiosError(error) && error.response?.status === 400 ? 'Kiểm tra bộ lọc; mỗi lần xuất tối đa 10.000 dòng.' : 'Không xuất được báo cáo. Vui lòng thử lại.') }
  finally { setExporting(false) }
 }
 function transactionsLink(courseId: number) {
  const next = new URLSearchParams({ courseId: String(courseId), status: 'SUCCEEDED' })
  for (const key of ['from', 'to']) { const value = params.get(key); if (value) next.set(key, value) }
  return `/admin/transactions?${next}`
 }
 return <section className="management-page reports-page">
  <header className="management-heading"><div><span className="management-brand">EduAdmin</span><h1>Báo cáo</h1></div><div className="report-actions">
   <button onClick={() => { void available.refetch(); void report.refetch() }} disabled={report.isFetching}>Làm mới</button>
   <button onClick={() => void exportCsv()} disabled={!data || report.isFetching || exporting || Boolean(report.error)}>{exporting ? 'Đang xuất…' : 'Xuất CSV'}</button>
  </div></header>
  {available.isLoading && <p role="status">Đang tải danh sách báo cáo…</p>}{available.error && <p role="alert" className="management-error">{errorMessage(available.error)}</p>}
  {available.data && <nav className="report-tabs" aria-label="Loại báo cáo">{sections.filter(section => available.data.includes(section.kind)).map(section => <button key={section.kind} aria-pressed={kind === section.kind} onClick={() => selectKind(section.kind)}>{section.label}</button>)}</nav>}
  <p className="report-description">{finance ? 'Thống kê tiền đã thu từ thanh toán thành công. Không cộng đăng ký chưa thanh toán hoặc giao dịch thất bại; tiền đã thu vẫn được ghi nhận khi học viên hủy vì không hoàn tiền.' : 'Thống kê trạng thái xuất bản và nội dung hiện có. Không tính khóa học đã xóa, bài học đã xóa và câu hỏi đã loại bỏ. Mỗi câu hỏi chỉ đếm một lần dù dùng ở nhiều bài.'}</p>
  <form key={`${kind}:${params}`} className="management-filters" onSubmit={apply}>
   <label>Mã khóa học<input name="courseId" type="number" min="1" step="1" defaultValue={params.get('courseId') ?? ''} /></label>
   <label>{finance ? 'Thanh toán từ ngày (UTC)' : 'Khóa học tạo từ ngày (UTC)'}<input name="from" type="date" defaultValue={params.get('from') ?? ''} /></label>
   <label>Đến ngày (UTC)<input name="to" type="date" defaultValue={params.get('to') ?? ''} /></label>
   <label>Số dòng<select name="size" defaultValue={size}><option>10</option><option>20</option><option>50</option></select></label>
   <div className="management-filter-actions"><button type="submit" className="primary-button">Áp dụng</button><button type="button" onClick={() => { setParams({ kind }); setValidation(''); setExportError('') }}>Xóa lọc</button></div>
  </form>
  {validation && <p role="alert" className="management-error">{validation}</p>}{exportError && <p role="alert" className="management-error">{exportError}</p>}
  {report.isLoading && <p role="status">Đang tải báo cáo…</p>}{report.error && <p role="alert" className="management-error">{errorMessage(report.error)}</p>}
  {data && !report.error && <>
   <dl className="report-totals report-metrics">{finance ? <>
    <div><dt>Doanh thu đã thu</dt><dd>{money(data.totalAmount)}</dd></div><div><dt>Thanh toán thành công</dt><dd>{(metrics.successfulPayments ?? 0).toLocaleString('vi-VN')}</dd></div><div><dt>Khóa học có doanh thu</dt><dd>{data.records.totalElements.toLocaleString('vi-VN')}</dd></div>
   </> : <><div><dt>Tổng khóa học</dt><dd>{data.records.totalElements.toLocaleString('vi-VN')}</dd></div><div><dt>Đã xuất bản</dt><dd>{(metrics.PUBLISHED ?? 0).toLocaleString('vi-VN')}</dd></div><div><dt>Bài học hiện có</dt><dd>{(metrics.lessons ?? 0).toLocaleString('vi-VN')}</dd></div><div><dt>Câu hỏi hiện có</dt><dd>{(metrics.questions ?? 0).toLocaleString('vi-VN')}</dd></div></>}</dl>
   {finance ? <ReportChart key="finance" title="Doanh thu theo khóa học" scope="Dữ liệu của trang hiện tại theo bộ lọc" points={data.records.items.map(row => ({ label: row.courseTitle, value: row.amount ?? 0 }))} formatValue={money} /> : <div className="report-content-charts">
    <ReportChart title="Khóa học theo trạng thái" scope="Toàn bộ khóa học phù hợp bộ lọc" points={Object.entries(statuses).filter(([status]) => (metrics[status] ?? 0) > 0).map(([status, label]) => ({ label, value: metrics[status] }))} />
    <ReportChart title="Phân bố nội dung" scope="Bài học và câu hỏi hiện có trong bộ lọc" points={[{ label: 'Bài học', value: metrics.lessons ?? 0 }, { label: 'Câu hỏi', value: metrics.questions ?? 0 }]} />
   </div>}
   {data.records.items.length ? <div className="management-table-wrap" aria-busy={report.isFetching}><table className="management-table"><thead><tr><th>Mã khóa học</th><th>Khóa học</th>{finance ? <><th>Thanh toán thành công</th><th>Doanh thu đã thu</th><th>Chi tiết</th></> : <><th>Trạng thái</th><th>Bài học hiện có</th><th>Câu hỏi hiện có</th></>}</tr></thead><tbody>
    {data.records.items.map(row => <tr key={row.id}><td>#{row.id}</td><td>{row.courseTitle}{row.demo && <small className="report-demo">DEMO</small>}</td>{finance ? <><td>{row.count ?? 0}</td><td>{money(row.amount)}</td><td><Link to={transactionsLink(row.id)} state={{ reportReturnTo }}>Xem giao dịch</Link></td></> : <><td>{row.status ? statuses[row.status] ?? row.status : 'Chưa lưu'}</td><td>{row.lessonCount ?? 0}</td><td>{row.questionCount ?? 0}</td></>}</tr>)}
   </tbody></table></div> : <p className="management-empty" role="status">Không có dữ liệu phù hợp.</p>}
   <nav className="management-pagination" aria-label="Phân trang báo cáo"><span>Trang {data.records.totalPages ? page + 1 : 0}/{data.records.totalPages}</span><button aria-label="Trang trước" disabled={page === 0 || report.isFetching} onClick={() => changePage(page - 1)}>&lt;</button><button aria-label="Trang sau" disabled={page + 1 >= data.records.totalPages || report.isFetching} onClick={() => changePage(page + 1)}>&gt;</button></nav>
  </>}
 </section>
}
