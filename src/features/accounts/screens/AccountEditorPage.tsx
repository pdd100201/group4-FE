import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { accountApi } from '../api/accountApi'
import type { AccountRequest, AccountRoleCode, AccountStatus } from '../../../shared/types/account'
import '../../management/screens/management.css'
import './accounts.css'

const roles: AccountRoleCode[] = ['ADMIN', 'MANAGER', 'EXPERT', 'STUDENT']
const statuses: { value: AccountStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Đang hoạt động' }, { value: 'INACTIVE', label: 'Chưa kích hoạt' }, { value: 'BLOCKED', label: 'Đã khóa' },
]
const empty: AccountRequest = { fullName: '', email: '', phone: '', roleCode: 'STUDENT' }
function message(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    if (error.response?.status === 409) return error.response.data?.message ?? 'Email, số điện thoại hoặc quy tắc tài khoản bị trùng.'
    if (error.response?.status === 404) return 'Không tìm thấy tài khoản.'
    if (error.response?.status === 400) return error.response.data?.message ?? 'Thông tin tài khoản không hợp lệ.'
  }
  return 'Không lưu được tài khoản. Vui lòng thử lại.'
}

export function AccountEditorPage({ create = false }: { create?: boolean }) {
  const { id = '' } = useParams()
  const accountId = Number(id)
  const validId = create || (Number.isSafeInteger(accountId) && accountId > 0)
  const location = useLocation(), navigate = useNavigate(), cache = useQueryClient()
  const [form, setForm] = useState<AccountRequest>(empty)
  const [success, setSuccess] = useState('')
  const detail = useQuery({ queryKey: ['admin-account', accountId], queryFn: () => accountApi.detail(accountId), enabled: !create && validId, retry: false })
  useEffect(() => { if (detail.data) setForm({ fullName: detail.data.fullName, email: detail.data.email, phone: detail.data.phone ?? '', roleCode: (detail.data.roles[0]?.replace('ROLE_', '') ?? 'STUDENT') as AccountRoleCode }) }, [detail.data])
  const save = useMutation({ mutationFn: (request: AccountRequest) => create ? accountApi.create(request) : accountApi.update(accountId, request), onSuccess: account => { void cache.invalidateQueries({ queryKey: ['admin-accounts'] }); if (create) navigate(`/admin/accounts/${account.id}`, { replace: true, state: { created: true } }); else { cache.setQueryData(['admin-account', accountId], account); setSuccess('Đã cập nhật tài khoản.') } } })
  const status = useMutation({ mutationFn: (value: AccountStatus) => accountApi.updateStatus(accountId, value), onSuccess: account => { cache.setQueryData(['admin-account', accountId], account); void cache.invalidateQueries({ queryKey: ['admin-accounts'] }); setSuccess('Đã cập nhật trạng thái và thu hồi phiên khi cần.') } })
  function submit(event: FormEvent) { event.preventDefault(); setSuccess(''); save.mutate({ ...form, fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() }) }
  const back = `/admin/accounts${create ? '' : location.search}`

  return <section className="management-page account-editor"><Link to={back}>Quay lại danh sách</Link><header className="management-heading"><div><span className="management-brand">EduAdmin</span><h1>{create ? 'Tạo tài khoản' : `Chi tiết tài khoản #${id}`}</h1></div></header>
    {!validId && <p role="alert" className="management-error">Mã tài khoản không hợp lệ.</p>}
    {detail.isLoading && <p role="status">Đang tải tài khoản...</p>}
    {detail.error && <p role="alert" className="management-error">{message(detail.error)}</p>}
    {(create || detail.data) && <><form className="account-form" onSubmit={submit}>
      <label>Họ và tên<input required maxLength={150} value={form.fullName} onChange={event => setForm(current => ({ ...current, fullName: event.target.value }))} /></label>
      <label>Email<input required type="email" maxLength={255} value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} /></label>
      <label>Số điện thoại<input maxLength={20} pattern="[0-9+() .-]{7,20}" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} /></label>
      <label>Vai trò<select value={form.roleCode} onChange={event => setForm(current => ({ ...current, roleCode: event.target.value as AccountRoleCode }))}>{roles.map(role => <option key={role}>{role}</option>)}</select></label>
      <div className="account-form-actions"><button className="primary-button" disabled={save.isPending}>{save.isPending ? 'Đang lưu...' : create ? 'Tạo và gửi email đặt mật khẩu' : 'Lưu thay đổi'}</button></div>
    </form>{save.error && <p role="alert" className="management-error">{message(save.error)}</p>}
      {!create && detail.data && <section className="account-status-panel"><h2>Trạng thái truy cập</h2><p>Thay đổi sang Chưa kích hoạt hoặc Đã khóa sẽ vô hiệu các phiên đang hoạt động.</p><div>{statuses.map(item => <button key={item.value} className={detail.data?.status === item.value ? 'selected' : ''} disabled={status.isPending || detail.data?.status === item.value} onClick={() => { setSuccess(''); status.mutate(item.value) }}>{item.label}</button>)}</div>{status.error && <p role="alert" className="management-error">{message(status.error)}</p>}</section>}
      {success && <p role="status" className="account-success">{success}</p>}{location.state && <p role="status" className="account-success">Đã tạo tài khoản và gửi liên kết đặt mật khẩu tới đúng email.</p>}
    </>}
  </section>
}
