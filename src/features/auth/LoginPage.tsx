import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { landingRoute } from '../../utils/roleRoutes'
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton'

type LoginLocationState = { from?: string }

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [error, setError] = useState(params.get('session') === 'expired' ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : '')
  const passwordChanged = params.get('password') === 'changed'
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [remember, setRemember] = useState(false)

  function destination(user: Awaited<ReturnType<typeof login>>) {
    const requested = (location.state as LoginLocationState | null)?.from
    navigate(requested?.startsWith('/') ? requested : landingRoute(user), { replace: true })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      const user = await login(String(form.get('email')), String(form.get('password')), remember)
      destination(user)
    } catch (cause) {
      const message = axios.isAxiosError<{ message?: string }>(cause) ? cause.response?.data?.message : undefined
      setError(message === 'Account email has not been verified'
        ? 'Tài khoản chưa xác minh email. Vui lòng kiểm tra hộp thư của bạn.'
        : message === 'Account is temporarily locked. Please try again later'
          ? 'Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau 30 phút.'
          : message === 'Account is inactive or blocked'
            ? 'Tài khoản đang bị vô hiệu hóa hoặc khóa. Vui lòng liên hệ hỗ trợ.'
            : 'Email hoặc mật khẩu không chính xác.')
    } finally { setSubmitting(false) }
  }

  async function googleLogin(credential: string) {
    setError(''); setSubmitting(true)
    try { destination(await loginWithGoogle(credential, remember)) }
    catch { setError('Không thể đăng nhập bằng Google. Hãy kiểm tra tài khoản thử nghiệm hoặc thử lại.') }
    finally { setSubmitting(false) }
  }

  return <section className="auth-page"><div className="auth-card"><div className="brand"><b>E</b> Edu<span>Learn</span></div>
    <h1>Chào mừng trở lại!</h1><p>Đăng nhập để tiếp tục hành trình học tập của bạn</p>
    <form onSubmit={submit}>{passwordChanged && <p className="success-panel" role="status">Đổi mật khẩu thành công. Vui lòng đăng nhập lại.</p>}{error && <p className="form-error" role="alert">{error}</p>}
      <label>Email<input name="email" type="email" autoComplete="email" placeholder="example@email.com" required /></label>
      <label>Mật khẩu<span className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" maxLength={72} placeholder="••••••••" required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Ẩn' : 'Hiện'}</button></span></label>
      <div><label className="check"><input name="remember" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Ghi nhớ đăng nhập</label><Link to="/forgot-password">Quên mật khẩu?</Link></div>
      <button className="primary-button" disabled={submitting}>{submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      <GoogleSignInButton onCredential={googleLogin} />
      <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
    </form><Link className="back-home" to="/">← Quay về trang chủ</Link></div></section>
}
