import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { accountApi } from '../api/accountApi'
import type { AccountStatus } from '../../../shared/types/account'
import '../../management/screens/management.css'
import './accounts.css'

const statusLabels: Record<AccountStatus, string> = { ACTIVE: 'Đang hoạt động', INACTIVE: 'Chưa kích hoạt', BLOCKED: 'Đã khóa' }
const roleLabels: Record<string, string> = { ROLE_ADMIN: 'Admin', ROLE_MANAGER: 'Manager', ROLE_EXPERT: 'Expert', ROLE_STUDENT: 'Student' }

export function AccountsPage() {
  const [params, setParams] = useSearchParams()
  const [validation, setValidation] = useState('')
  const request = new URLSearchParams(params)
  const rawPage = Number(params.get('page') ?? 0)
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const size = ['5', '10', '20', '50'].includes(params.get('size') ?? '') ? Number(params.get('size')) : 10
  request.set('page', String(page)); request.set('size', String(size))
  const query = useQuery({ queryKey: ['admin-accounts', request.toString()], queryFn: () => accountApi.list(request), retry: false })
  const totalPages = query.data?.totalPages ?? 0
  useEffect(() => {
    if (query.data && page > Math.max(0, totalPages - 1)) {
      const next = new URLSearchParams(params)
      next.set('page', String(Math.max(0, totalPages - 1)))
      setParams(next, { replace: true })
    }
  }, [query.data, page, totalPages, params, setParams])
  const firstPage = Math.max(0, Math.min(page - 2, totalPages - 5))
  const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPage + index)

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    new FormData(event.currentTarget).forEach((value, key) => { if (String(value).trim()) next.set(key, String(value).trim()) })
    if ((next.get('q')?.length ?? 0) > 200) { setValidation('Từ khóa tối đa 200 ký tự.'); return }
    next.set('page', '0'); setValidation(''); setParams(next)
  }
  function move(nextPage: number) { const next = new URLSearchParams(params); next.set('page', String(nextPage)); setParams(next) }
  const error = query.error && isAxiosError(query.error) && query.error.response?.status === 403
    ? 'Bạn không có quyền quản trị tài khoản.' : query.error ? 'Không tải được danh sách tài khoản.' : ''

  return <section className="management-page accounts-page">
    <header className="management-heading"><div><span className="management-brand">EduAdmin</span><h1>Tài khoản và phân quyền</h1></div>
      <Link className="primary-button account-command" to="/admin/accounts/new">Tạo tài khoản</Link></header>
    <form className="management-filters" key={params.toString()} onSubmit={apply}>
      <label className="management-search">Tìm kiếm<input name="q" maxLength={200} defaultValue={params.get('q') ?? ''} placeholder="Tên, email hoặc số điện thoại" /></label>
      <label>Vai trò<select name="role" defaultValue={params.get('role') ?? ''}><option value="">Tất cả</option>{['ADMIN', 'MANAGER', 'EXPERT', 'STUDENT'].map(role => <option key={role}>{role}</option>)}</select></label>
      <label>Trạng thái<select name="status" defaultValue={params.get('status') ?? ''}><option value="">Tất cả</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Số dòng<select name="size" value={size} onChange={event => { const next = new URLSearchParams(params); next.set('size', event.target.value); next.set('page', '0'); setParams(next) }}><option>5</option><option>10</option><option>20</option><option>50</option></select></label>
      <div className="management-filter-actions"><button className="primary-button" type="submit">Áp dụng</button><button type="button" onClick={() => { setValidation(''); setParams({}) }}>Xóa lọc</button></div>
    </form>
    {validation && <p role="alert" className="management-error">{validation}</p>}
    {query.isLoading && <p role="status">Đang tải tài khoản...</p>}
    {error && <div role="alert" className="management-error">{error} <button onClick={() => void query.refetch()}>Thử lại</button></div>}
    {query.data && !query.error && <>{query.data.items.length ? <div className="management-table-wrap" aria-busy={query.isFetching}><table className="management-table"><thead><tr><th>Tài khoản</th><th>Vai trò</th><th>Điện thoại</th><th>Trạng thái</th><th>Khóa đăng nhập</th><th></th></tr></thead><tbody>
      {query.data.items.map(account => <tr key={account.id}><td>{account.fullName}<small>{account.email} · #{account.id}</small></td><td>{account.roles.map(role => roleLabels[role] ?? role).join(', ')}</td><td>{account.phone ?? 'Chưa cập nhật'}</td><td><span className={`management-status status-${account.status.toLowerCase()}`}>{statusLabels[account.status]}</span></td><td>{account.lockedUntil ? new Date(account.lockedUntil).toLocaleString('vi-VN') : 'Không'}</td><td><Link to={`/admin/accounts/${account.id}?${params.toString()}`}>Chi tiết</Link></td></tr>)}
    </tbody></table></div> : <p className="management-empty" role="status">Không có tài khoản phù hợp.</p>}
      <nav className="management-pagination account-pagination" aria-label="Phân trang tài khoản">
        <p>{query.data.items.length ? `${(page * size + 1).toLocaleString('vi-VN')}–${(page * size + query.data.items.length).toLocaleString('vi-VN')}` : '0'} / {query.data.totalElements.toLocaleString('vi-VN')} tài khoản</p>
        <div className="account-page-buttons">
          <button title="Trang đầu" aria-label="Trang đầu" disabled={page === 0 || query.isFetching || !totalPages} onClick={() => move(0)}>«</button>
          <button title="Trang trước" aria-label="Trang trước" disabled={page === 0 || query.isFetching || !totalPages} onClick={() => move(page - 1)}>‹</button>
          {visiblePages.map(number => <button key={number} aria-label={`Trang ${number + 1}`} aria-current={number === page ? 'page' : undefined} disabled={query.isFetching} onClick={() => move(number)}>{number + 1}</button>)}
          <button title="Trang sau" aria-label="Trang sau" disabled={page + 1 >= totalPages || query.isFetching} onClick={() => move(page + 1)}>›</button>
          <button title="Trang cuối" aria-label="Trang cuối" disabled={page + 1 >= totalPages || query.isFetching} onClick={() => move(totalPages - 1)}>»</button>
        </div>
      </nav>
    </>}
  </section>
}
