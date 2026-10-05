import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const user = await login(String(form.get('email')), String(form.get('password')))
      navigate(user.roles.some((role) => role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER')
        ? '/dashboard'
        : user.roles.includes('ROLE_EXPERT') ? '/expert/courses' : '/student/courses')
    } catch {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.')
    }
  }

  return <section className="auth-page"><div className="auth-card"><div className="brand"><b>E</b> Edu<span>Learn</span></div>
    <h1>Chào mừng trở lại!</h1><p>Đăng nhập để tiếp tục hành trình học tập của bạn</p>
    <form onSubmit={submit}>{error && <p role="alert">{error}</p>}
      <label>Email<input name="email" type="email" placeholder="example@email.com" required /></label>
      <label>Mật khẩu<input name="password" type="password" placeholder="••••••••" required /></label>
      <div><label className="check"><input type="checkbox" /> Ghi nhớ đăng nhập</label><Link to="/forgot-password">Quên mật khẩu?</Link></div>
      <button className="primary-button">Đăng nhập</button><p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
    </form></div></section>
}
