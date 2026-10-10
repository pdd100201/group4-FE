import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState(token ? 'Đang xác minh email…' : 'Liên kết xác minh không hợp lệ.')
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (!token) return
    authService.verifyEmail(token).then(() => {
      setVerified(true); setStatus('Email đã được xác minh. Tài khoản của bạn đã được kích hoạt.')
    }).catch(() => setStatus('Liên kết xác minh không hợp lệ hoặc đã hết hạn.'))
  }, [token])

  return <section className="auth-page"><div className="auth-card"><h1>Xác minh email</h1>
    <p role="status">{status}</p>
    {verified && <Link className="primary-button inline-button" to="/login">Đăng nhập</Link>}
    {!verified && <Link to="/login">Quay lại đăng nhập</Link>}
  </div></section>
}
