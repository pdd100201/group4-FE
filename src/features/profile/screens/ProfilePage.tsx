import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MediaUpload } from '../../../shared/components/media/MediaUpload'
import { useAuth } from '../../../shared/context/AuthContext'
import { profileApi } from '../api/profileApi'
import './profile.css'

function errorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) return error.response?.data?.message ?? 'Không lưu được thay đổi.'
  return 'Không lưu được thay đổi.'
}

export function ProfilePage() {
  const cache = useQueryClient(), navigate = useNavigate(), { updateCurrentUser, logout } = useAuth()
  const query = useQuery({ queryKey: ['profile'], queryFn: profileApi.current, retry: false })
  const [fullName, setFullName] = useState(''), [phone, setPhone] = useState(''), [avatarUrl, setAvatarUrl] = useState('')
  const [profileMessage, setProfileMessage] = useState(''), [passwordMessage, setPasswordMessage] = useState('')
  useEffect(() => { if (query.data) { setFullName(query.data.fullName); setPhone(query.data.phone ?? ''); setAvatarUrl(query.data.avatarUrl ?? '') } }, [query.data])
  const save = useMutation({ mutationFn: profileApi.update, onSuccess: profile => { cache.setQueryData(['profile'], profile); updateCurrentUser({ fullName: profile.fullName, avatarUrl: profile.avatarUrl ?? undefined }); setProfileMessage('Đã cập nhật hồ sơ.') } })
  const change = useMutation({ mutationFn: profileApi.changePassword, onSuccess: async () => { setPasswordMessage('Đổi mật khẩu thành công. Đang chuyển về trang đăng nhập...'); await logout(); navigate('/login?password=changed', { replace: true }) } })
  function submitProfile(event: FormEvent) { event.preventDefault(); setProfileMessage(''); save.mutate({ fullName: fullName.trim(), phone: phone.trim(), avatarUrl: avatarUrl.trim() }) }
  function submitPassword(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPasswordMessage(''); const data = new FormData(event.currentTarget); change.mutate({ currentPassword: String(data.get('currentPassword') ?? ''), newPassword: String(data.get('newPassword') ?? ''), confirmation: String(data.get('confirmation') ?? '') }) }

  return <section className="profile-page"><header><span>Hồ sơ cá nhân</span><h1>Thông tin tài khoản</h1></header>
    {query.isLoading && <p role="status">Đang tải hồ sơ...</p>}{query.error && <p role="alert" className="profile-error">Không tải được hồ sơ.</p>}
    {query.data && <div className="profile-layout"><form className="profile-panel" onSubmit={submitProfile}><h2>Thông tin cơ bản</h2>
      <div className="profile-avatar">{avatarUrl ? <img src={avatarUrl} alt="Ảnh đại diện" /> : <span>{fullName[0]?.toUpperCase() ?? 'U'}</span>}<MediaUpload purpose="AVATAR" disabled={save.isPending} onUploaded={media => setAvatarUrl(media.url ?? '')} /></div>
      <label>Email<input value={query.data.email} readOnly aria-readonly="true" /></label><small>Email không thể thay đổi trong hồ sơ cá nhân.</small>
      <label>Họ và tên<input required maxLength={150} value={fullName} onChange={event => setFullName(event.target.value)} /></label>
      <label>Số điện thoại<input maxLength={20} pattern="[0-9+() .-]{7,20}" value={phone} onChange={event => setPhone(event.target.value)} /></label>
      <button className="primary-button" disabled={save.isPending}>{save.isPending ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>{save.error && <p role="alert" className="profile-error">{errorMessage(save.error)}</p>}{profileMessage && <p role="status" className="profile-success">{profileMessage}</p>}
    </form><form className="profile-panel" onSubmit={submitPassword}><h2>Đổi mật khẩu</h2>
      <label>Mật khẩu hiện tại<input name="currentPassword" type="password" required maxLength={72} autoComplete="current-password" /></label>
      <label>Mật khẩu mới<input name="newPassword" type="password" required minLength={8} maxLength={72} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+" autoComplete="new-password" /></label><small>Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.</small>
      <label>Xác nhận mật khẩu mới<input name="confirmation" type="password" required minLength={8} maxLength={72} autoComplete="new-password" /></label>
      <button className="primary-button" disabled={change.isPending}>{change.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>{change.error && <p role="alert" className="profile-error">{errorMessage(change.error)}</p>}{passwordMessage && <p role="status" className="profile-success">{passwordMessage}</p>}
    </form></div>}
  </section>
}
