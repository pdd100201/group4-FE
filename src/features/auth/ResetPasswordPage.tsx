import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const token = params.get('token')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    if (password !== String(form.get('confirmPassword'))) {
      setError('Mật khẩu mới và xác nhận không khớp.'); return
    }
    setError('')
    try {
      await authService.resetPassword(token!, password)
      setMessage('Mật khẩu đã được cập nhật. Tất cả phiên đăng nhập cũ đã kết thúc.')
      event.currentTarget.reset()
    } catch { setError('Liên kết đặt lại mật khẩu đã hết hạn, không hợp lệ hoặc đã được sử dụng.') }
  }

  return <section className="auth-page"><div className="auth-card"><h1>Đặt lại mật khẩu</h1>
    {!token ? <p className="form-error" role="alert">Thiếu mã đặt lại mật khẩu.</p> : message ? <div className="success-panel" role="status"><p>{message}</p><Link to="/login">Đăng nhập</Link></div> : <form onSubmit={submit}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label>Mật khẩu mới<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /><small>Từ 8 đến 72 ký tự.</small></label>
      <label>Xác nhận mật khẩu<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></label>
      <button className="primary-button">Cập nhật mật khẩu</button>
    </form>}
    {!message && <Link to="/login">Quay lại đăng nhập</Link>}
  </div></section>
}
