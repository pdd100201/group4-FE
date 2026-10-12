import { Link, useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useEmailVerification } from '../../../shared/hooks/useEmailVerification'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const query = useEmailVerification(token)
  const verified = Boolean(token) && query.isSuccess
  const invalid = isAxiosError(query.error) && query.error.response?.status === 400
  const status = !token ? 'Liên kết xác minh không hợp lệ.'
    : verified ? 'Email đã được xác minh. Tài khoản của bạn đã được kích hoạt.'
      : query.isError ? invalid ? 'Liên kết xác minh đã được sử dụng, không hợp lệ hoặc đã hết hạn.'
        : 'Không thể kết nối dịch vụ xác minh. Vui lòng thử lại sau.'
        : 'Đang xác minh email…'

  return <section className="auth-page"><div className="auth-card"><h1>Xác minh email</h1>
    <p role="status">{status}</p>
    {verified && <Link className="primary-button inline-button" to="/login">Đăng nhập</Link>}
    {!verified && <Link to="/login">Quay lại đăng nhập</Link>}
  </div></section>
}
