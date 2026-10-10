import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton'
import { useAuth } from '../../context/AuthContext'
import { landingRoute } from '../../utils/roleRoutes'

export function RegisterPage() {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    if (password !== String(form.get('confirmPassword'))) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setError(''); setSubmitting(true)
    try {
      await authService.register({
        fullName: String(form.get('fullName')),
        email: String(form.get('email')),
        phone: String(form.get('phone')),
        password,
      })
      setMessage('Đăng ký thành công. Liên kết xác minh đã được gửi đến email của bạn.')
      event.currentTarget.reset()
    } catch (cause) {
      const apiMessage = axios.isAxiosError<{ message?: string }>(cause) ? cause.response?.data?.message : undefined
      setError(apiMessage === 'Email already registered'
        ? 'Email này đã được đăng ký.'
        : apiMessage === 'Phone number already registered'
          ? 'Số điện thoại này đã được sử dụng.'
          : apiMessage === 'Email service is unavailable'
            ? 'Không thể gửi email xác minh. Vui lòng kiểm tra cấu hình Gmail SMTP.'
            : 'Không thể đăng ký lúc này. Vui lòng thử lại.')
    } finally { setSubmitting(false) }
  }

  async function googleRegister(credential: string) {
    if (!acceptedTerms) { setError('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.'); return }
    setError(''); setSubmitting(true)
    try {
      const user = await loginWithGoogle(credential, true)
      navigate(landingRoute(user), { replace: true })
    } catch { setError('Không thể đăng ký bằng Google. Hãy kiểm tra tài khoản thử nghiệm hoặc thử lại.') }
    finally { setSubmitting(false) }
  }

  return <section className="auth-page"><div className="auth-card"><div className="brand"><b>E</b> Edu<span>Learn</span></div>
    <h1>Tạo tài khoản học viên</h1><p>Điền thông tin để bắt đầu học cùng EduLearn</p>
    {message ? <div className="success-panel" role="status"><p>{message}</p><Link to="/login">Đến trang đăng nhập</Link></div> : <form onSubmit={submit}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label>Họ và tên<input name="fullName" autoComplete="name" maxLength={150} required /></label>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Số điện thoại<input name="phone" type="tel" autoComplete="tel" pattern="[0-9+() .-]{7,20}" /></label>
      <label>Mật khẩu<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /><small>Từ 8 đến 72 ký tự.</small></label>
      <label>Xác nhận mật khẩu<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></label>
      <label className="terms"><input name="terms" type="checkbox" required checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} /> Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.</label>
      <button className="primary-button" disabled={submitting}>{submitting ? 'Đang tạo tài khoản…' : 'Đăng ký'}</button>
      <GoogleSignInButton onCredential={googleRegister} />
      <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </form>}
  </div></section>
}
