import { useState, type FormEvent } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useManagementRecord, useManagementRecords } from '../hooks/useManagementRecords'
import type { ManagementKind, ManagementRecord, ManagementScope, RegistrationRecord } from '../types/management'
import './management.css'

const labels: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán', ACTIVE: 'Đang hoạt động', CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn', FAILED: 'Thất bại', PENDING: 'Đang xử lý',
  SUCCEEDED: 'Thành công', REFUNDED: 'Đã hoàn tiền',
}
const money = (value: number | null) => value == null ? 'Chưa lưu' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
const date = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Chưa lưu'
function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 404) return 'Không tìm thấy bản ghi.'
    if (error.response?.status === 403) return 'Bạn không có quyền xem dữ liệu này.'
    if (error.response?.status === 400) return 'Bộ lọc không hợp lệ. Kiểm tra ngày, số tiền và mã khóa học.'
  }
  return 'Không tải được dữ liệu. Vui lòng thử lại.'
}
function Badge({ status }: { status: string }) {
  return <span className={`management-status status-${status.toLowerCase()}`}>{labels[status] ?? status}</span>
}
function scopeFromPath(path: string): ManagementScope {
  return path.startsWith('/admin/') ? 'admin' : 'manager'
}
function registrationOf(record: ManagementRecord): RegistrationRecord {
  return 'registration' in record ? record.registration : record
}

export function ManagementRecordsPage({ kind }: { kind: ManagementKind }) {
  const scope = scopeFromPath(useLocation().pathname)
  const [params, setParams] = useSearchParams()
  const [validation, setValidation] = useState('')
  const request = new URLSearchParams(params)
  const rawPage = Number(params.get('page') ?? 0)
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const size = ['10', '20', '50'].includes(params.get('size') ?? '') ? Number(params.get('size')) : 20
  request.set('page', String(page))
  request.set('size', String(size))
  const { data, isLoading, isFetching, error, refetch } = useManagementRecords(scope, kind, request)
  const transactions = kind === 'transactions'
  const statuses = transactions ? ['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED'] : ['PENDING_PAYMENT', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'FAILED']

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const [key, value] of values.entries()) if (String(value).trim()) next.set(key, String(value).trim())
    const from = next.get('from'), to = next.get('to')
    const min = next.get('minAmount'), max = next.get('maxAmount')
    if ((from && to && from > to) || (min && max && Number(min) > Number(max))) {
      setValidation('Khoảng ngày hoặc số tiền không hợp lệ.')
      return
    }
    setValidation('')
    next.set('page', '0')
    setParams(next)
  }
  function changePage(nextPage: number) {
    const next = new URLSearchParams(params)
    next.set('page', String(nextPage))
    setParams(next)
  }

  return <section className="management-page">
    <header className="management-heading"><div><span className="management-brand">EduCRM</span><h1>{transactions ? 'Giao dịch' : 'Quản lý đăng ký'}</h1></div>
      <button type="button" onClick={() => refetch()} disabled={isFetching}>Làm mới</button></header>
    <form className="management-filters" key={params.toString()} onSubmit={applyFilters}>
      <label className="management-search">Tìm kiếm<input name="q" defaultValue={params.get('q') ?? ''} maxLength={200} placeholder={transactions ? 'Mã giao dịch, học viên, khóa học' : 'Tên, email, khóa học'} /></label>
      <label>Mã khóa học<input name="courseId" type="number" min="1" step="1" defaultValue={params.get('courseId') ?? ''} /></label>
      <label>Trạng thái<select name="status" defaultValue={params.get('status') ?? ''}><option value="">Tất cả</option>{statuses.map(s => <option key={s} value={s}>{labels[s]}</option>)}</select></label>
      <label>Từ ngày (UTC)<input name="from" type="date" defaultValue={params.get('from') ?? ''} /></label>
      <label>Đến ngày (UTC)<input name="to" type="date" defaultValue={params.get('to') ?? ''} /></label>
      {transactions && <><label>Phương thức<select name="provider" defaultValue={params.get('provider') ?? ''}><option value="">Tất cả</option><option value="VNPAY">VNPAY</option></select></label>
        <label>Số tiền từ<input name="minAmount" type="number" min="0" step="0.01" defaultValue={params.get('minAmount') ?? ''} /></label>
        <label>Số tiền đến<input name="maxAmount" type="number" min="0" step="0.01" defaultValue={params.get('maxAmount') ?? ''} /></label></>}
      <label>Số dòng<select name="size" defaultValue={size}><option>10</option><option>20</option><option>50</option></select></label>
      <div className="management-filter-actions"><button className="primary-button" type="submit">Áp dụng</button><button type="button" onClick={() => { setValidation(''); setParams({}) }}>Xóa lọc</button></div>
    </form>
    {validation && <p role="alert" className="management-error">{validation}</p>}
    {isLoading && <p role="status">Đang tải...</p>}
    {error && <div role="alert" className="management-error">{errorMessage(error)} <button onClick={() => refetch()}>Thử lại</button></div>}
    {!isLoading && !error && data && <>
      {data.items.length > 0 ? <div className="management-table-wrap" aria-busy={isFetching}><table className="management-table"><thead><tr>
        <th>{transactions ? 'Giao dịch' : 'Đăng ký'}</th><th>Học viên</th><th>Khóa học / Gói</th><th>Số tiền</th>
        {transactions && <th>Phương thức</th>}<th>Trạng thái</th><th>{transactions ? 'Ngày giao dịch' : 'Ngày đăng ký'}</th>
        {!transactions && <th>Hiệu lực</th>}<th></th>
      </tr></thead><tbody>
        {data.items.map(record => {
          const registration = registrationOf(record)
          return <tr key={record.id}><td>#{record.id}{'registration' in record && <small>{record.providerReference ?? 'Chưa có mã cổng'}</small>}</td>
            <td>{registration.studentName}<small>{registration.studentEmail}</small></td>
            <td>{registration.courseTitle}<small>{registration.packageName ?? 'Chưa lưu gói'}</small></td>
            <td>{money(record.amount)}</td>{'registration' in record && <td>{record.provider ?? 'Chưa lưu'}</td>}
            <td><Badge status={record.status} /></td><td>{date(record.createdAt)}</td>
            {!transactions && <td>{date(registration.validFrom)}<small>{date(registration.validUntil)}</small></td>}
            <td><Link to={`/${scope}/${kind}/${record.id}?${params.toString()}`}>Chi tiết</Link></td></tr>
        })}
      </tbody></table></div> : <p className="management-empty" role="status">Không có {transactions ? 'giao dịch' : 'đăng ký'} phù hợp.</p>}
      <nav className="management-pagination" aria-label="Phân trang">
        <span>{data.totalElements.toLocaleString('vi-VN')} bản ghi · Trang {data.totalPages ? data.page + 1 : 0}/{data.totalPages}</span>
        <button title="Trang trước" aria-label="Trang trước" disabled={page === 0 || isFetching} onClick={() => changePage(page - 1)}>&lt;</button>
        <button title="Trang sau" aria-label="Trang sau" disabled={page + 1 >= data.totalPages || isFetching} onClick={() => changePage(page + 1)}>&gt;</button>
      </nav>
    </>}
  </section>
}

function RegistrationFields({ record }: { record: RegistrationRecord }) {
  return <dl className="management-details">
    <dt>Học viên</dt><dd>{record.studentName} · {record.studentEmail}</dd>
    <dt>Khóa học</dt><dd>{record.courseTitle} (#{record.courseId})</dd>
    <dt>Trạng thái đăng ký</dt><dd><Badge status={record.status} /></dd>
    <dt>Gói tại thời điểm đăng ký</dt><dd>{record.packageName ?? 'Chưa lưu'}</dd>
    <dt>Giá gốc</dt><dd>{money(record.originalPrice)}</dd>
    <dt>Giảm giá</dt><dd>{money(record.discount)}</dd>
    <dt>Chi phí cuối cùng</dt><dd>{money(record.amount)}</dd>
    <dt>Thời hạn gói</dt><dd>{record.validityDays == null ? 'Chưa lưu' : `${record.validityDays} ngày`}</dd>
    <dt>Ngày đăng ký</dt><dd>{date(record.createdAt)}</dd>
    <dt>Hiệu lực từ</dt><dd>{date(record.validFrom)}</dd>
    <dt>Hiệu lực đến</dt><dd>{date(record.validUntil)}</dd>
    <dt>Ghi chú</dt><dd className="management-note">{record.note ?? 'Không có'}</dd>
  </dl>
}

export function ManagementRecordDetailPage({ kind }: { kind: ManagementKind }) {
  const { id = '' } = useParams()
  const location = useLocation()
  const scope = scopeFromPath(location.pathname)
  const { data, isLoading, error, refetch } = useManagementRecord(scope, kind, id)
  const validId = /^\d+$/.test(id) && Number(id) > 0
  return <section className="management-page">
    <Link to={`/${scope}/${kind}${location.search}`}>Quay lại danh sách</Link>
    <header className="management-heading"><h1>{kind === 'transactions' ? 'Chi tiết giao dịch' : 'Chi tiết đăng ký'} #{id}</h1></header>
    {!validId && <p role="alert">Mã bản ghi không hợp lệ.</p>}
    {isLoading && <p role="status">Đang tải...</p>}
    {error && <div role="alert" className="management-error">{errorMessage(error)} <button onClick={() => refetch()}>Thử lại</button></div>}
    {data && <>
      {'registration' in data && <><h2>Thông tin thanh toán</h2><dl className="management-details">
        <dt>Mã payment</dt><dd>#{data.paymentId}</dd><dt>Mã cổng thanh toán</dt><dd>{data.providerReference ?? 'Chưa lưu'}</dd>
        <dt>Phương thức</dt><dd>{data.provider ?? 'Chưa lưu'}</dd><dt>Loại giao dịch</dt><dd>{data.type}</dd>
        <dt>Số tiền giao dịch</dt><dd>{money(data.amount)}</dd><dt>Trạng thái thanh toán</dt><dd><Badge status={data.status} /></dd>
        <dt>Ngày giao dịch</dt><dd>{date(data.createdAt)}</dd>
      </dl><h2>Đăng ký #{data.registration.id}</h2></>}
      <RegistrationFields record={registrationOf(data)} />
    </>}
  </section>
}
