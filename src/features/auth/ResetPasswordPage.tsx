import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [message, setMessage] = useState('')
  const token = params.get('token')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    const password = String(new FormData(event.currentTarget).get('password'))
    try {
      await authService.resetPassword(token, password)
      setMessage('Mật khẩu đã được cập nhật. Bạn có thể đăng nhập.')
    } catch {
      setMessage('Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.')
    }
  }

  return <section className="auth-page"><div className="auth-card"><h1>Đặt lại mật khẩu</h1>
    {!token ? <p role="alert">Thiếu mã đặt lại mật khẩu.</p> : <form onSubmit={submit}>
      <label>Mật khẩu mới<input name="password" type="password" minLength={8} required /></label>
      <button className="primary-button">Cập nhật mật khẩu</button>
    </form>}
    {message && <p role="status">{message}</p>}
    <Link to="/login">Quay lại đăng nhập</Link>
  </div></section>
}
