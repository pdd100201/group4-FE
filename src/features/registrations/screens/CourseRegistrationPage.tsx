import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { usePublicCourse } from '../../../shared/hooks/usePublicCourse'
import { useCreateRegistration } from '../../../shared/hooks/useStudentRegistrations'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import { coursePrice } from '../../courses/screens/PublicCourseCard'
import './registrations.css'
export function CourseRegistrationPage() {
  const { courseId } = useParams()
  const id = Number(courseId)
  const [params] = useSearchParams()
  const selectedId = Number(params.get('packageId'))
  const query = usePublicCourse(id)
  const { user } = useAuth()
  const create = useCreateRegistration()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [phone, setPhone] = useState('')
  if (!Number.isSafeInteger(id) || id <= 0) return <p role="alert">Mã khóa học không hợp lệ.</p>
  if (query.isPending) return <p role="status">Đang tải thông tin đăng ký…</p>
  if (query.isError) return <div role="alert">{courseError(query.error)} <Link to="/courses">Về danh sách khóa học</Link></div>
  const course = query.data
  const selected = course.packages?.find(p => p.id === selectedId)
  if (!selected) return <section className="registration-page"><h1>Gói học không còn khả dụng</h1><Link to={`/courses/${id}`}>Quay lại chọn gói học</Link></section>
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selected || create.isPending) return
    try { const result = await create.mutateAsync({ courseId: id, packageId: selected.id, fullName: fullName.trim(), phone: phone.trim() }); navigate(`/student/registrations/${result.id}`, { state: { reused: result.reused } }) } catch { /* Display API validation. */ }
  }
  return <section className="registration-page"><Link to={`/courses/${id}`}>← Thông tin khóa học</Link><h1>Đăng ký khóa học</h1><p>1. Chọn gói → 2. Xác nhận đăng ký → 3. Thanh toán (module tích hợp riêng)</p>
    <div className="registration-grid"><form className="course-panel" onSubmit={event => void submit(event)}><h2>Thông tin học viên</h2><fieldset disabled={create.isPending}>
      <label>Họ và tên *<input required maxLength={255} value={fullName} onChange={e => setFullName(e.target.value)} /></label>
      <label>Email tài khoản<input readOnly value={user?.email ?? ''} /></label>
      <label>Số điện thoại *<input required type="tel" minLength={8} maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} /></label>
      <button type="submit" className="course-primary">{create.isPending ? 'Đang tạo đăng ký…' : 'Xác nhận đăng ký'}</button></fieldset>
      {create.isError && <p className="course-error" role="alert">{courseError(create.error)}</p>}
    </form><aside className="course-panel"><h2>{course.title}</h2><p>Gói: {selected.name}</p><p>Giá gốc: {coursePrice(selected.price)}</p><p>Giảm {selected.discountPercent}%: {coursePrice(selected.discountAmount)}</p><h2>Tổng: {coursePrice(selected.finalPrice)}</h2><p>Thời hạn được tính từ lúc thanh toán thành công. Đăng ký này chưa cấp quyền học.</p><p>Số tiền được backend xác định lại lúc đăng ký. Nếu đã có đăng ký chờ thanh toán, hệ thống mở đăng ký cũ và giữ giá đã chốt.</p></aside></div>
  </section>
}
