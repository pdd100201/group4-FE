import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { authService } from '../../services/authService'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  async function requestReset(address: string) {
    setError('')
    try {
      await authService.forgotPassword(address)
      setSent(true); setCountdown(48)
    } catch (cause) {
      const message = axios.isAxiosError<{ message?: string }>(cause) ? cause.response?.data?.message : undefined
      setError(message === 'Email service is unavailable'
        ? 'Không thể kết nối Gmail SMTP. Vui lòng kiểm tra Gmail và App Password.'
        : 'Không thể gửi yêu cầu lúc này. Vui lòng thử lại.')
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await requestReset(email)
  }

  return <section className="auth-page"><div className="auth-card"><h1>Quên mật khẩu</h1>
    {!sent ? <form onSubmit={submit}>{error && <p className="form-error" role="alert">{error}</p>}
      <p>Nhập email tài khoản để nhận liên kết đặt lại mật khẩu có hiệu lực trong 15 phút.</p>
      <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" autoComplete="email" required /></label>
      <button className="primary-button">Gửi liên kết</button></form> : <div className="success-panel" role="status">
      <p>Nếu email đã được đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
      <button disabled={countdown > 0} onClick={() => requestReset(email)}>{countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại email'}</button>
    </div>}
    {sent && error && <p className="form-error" role="alert">{error}</p>}
    <Link to="/login">Quay lại đăng nhập</Link>
  </div></section>
}
