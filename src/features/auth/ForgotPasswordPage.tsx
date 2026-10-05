import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/authService'

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email'))
    try {
      await authService.forgotPassword(email)
      setMessage('Nếu email đã được đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.')
    } catch {
      setMessage('Không thể gửi yêu cầu lúc này. Vui lòng thử lại.')
    }
  }

  return <section className="auth-page"><div className="auth-card"><h1>Quên mật khẩu</h1>
    <form onSubmit={submit}><label>Email<input name="email" type="email" required /></label>
      <button className="primary-button">Gửi liên kết</button></form>
    {message && <p role="status">{message}</p>}
    <Link to="/login">Quay lại đăng nhập</Link>
  </div></section>
}
