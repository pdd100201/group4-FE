import { Link, useLocation, useParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { courseApi } from '../api/courseApi'
import { useAuth } from '../../../shared/context/AuthContext'
import { usePublicCourse } from '../../../shared/hooks/usePublicCourse'
import { coursePrice } from './PublicCourseCard'
import './public-courses.css'

export function CourseDetailPage() {
  const { courseId } = useParams()
  const id = Number(courseId)
  const query = usePublicCourse(id)
  const { user } = useAuth()
  const student = Boolean(user?.roles.includes('ROLE_STUDENT'))
  const enrollment = useQuery({ queryKey: ['course-enrollment', user?.id, id], queryFn: () => courseApi.enrollment(id),
    enabled: student && query.isSuccess && Number.isSafeInteger(id) && id > 0, retry: false })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const location = useLocation()
  useEffect(() => {
    if (query.data && location.hash === '#course-packages') document.getElementById('course-packages')?.scrollIntoView({ block: 'start' })
  }, [query.data, location.hash])
  if (!Number.isSafeInteger(id) || id <= 0) return <section className="landing-section"><h1>Mã khóa học không hợp lệ</h1><Link to="/courses">Quay lại danh sách khóa học</Link></section>
  if (query.isPending) return <section className="landing-section"><p role="status">Đang tải chi tiết khóa học…</p></section>
  if (query.isError) {
    const unavailable = isAxiosError(query.error) && query.error.response?.status === 404
    return <section className="landing-section" role="alert"><h1>{unavailable ? 'Khóa học không còn khả dụng' : 'Không tải được khóa học'}</h1>
      <p>{unavailable ? 'Khóa học không tồn tại, chưa được xuất bản hoặc đã được ẩn.' : 'Vui lòng kiểm tra kết nối và thử lại.'}</p>
      {!unavailable && <button onClick={() => void query.refetch()}>Thử lại</button>} <Link to="/courses">Quay lại danh sách khóa học</Link></section>
  }
  const course = query.data
  const packages = course.packages ?? []
  const selected = packages.find(p => p.id === selectedId) ?? packages[0]
  const registerTo = selected ? `/student/courses/${id}/register?packageId=${selected.id}` : ''
  return <><section className="course-hero"><div className="course-hero-content">
    <small><Link to="/">Trang chủ</Link> / <Link to="/courses">Khóa học</Link> / {course.category || 'Chưa phân loại'} / <b>{course.title}</b></small>
    <h1>{course.title}</h1><span>Giảng viên: <b>{course.expertName || 'Chưa cập nhật'}</b></span>
  </div></section>
    <div className="course-detail-content"><div className="detail-layout"><section>
      <article className="learn-box"><h3>Thông tin khóa học</h3><p>Danh mục: {course.category || 'Chưa phân loại'}</p><p>{course.lessons.length} bài học đang hiển thị · {course.quizCount} bài kiểm tra đang hoạt động</p></article>
      <h2>Mô tả khóa học</h2><p className="public-course-description">{course.description || 'Giảng viên chưa cập nhật mô tả.'}</p>
      <h2>Nội dung khóa học</h2>
      {course.lessons.length === 0 ? <p>Chưa có bài học đang hiển thị.</p> : <ol className="public-course-outline">{course.lessons.map((lesson, index) =>
        <li className="curriculum" key={lesson.id}><b>{index + 1}. {lesson.title}</b><span>Bài học</span></li>)}</ol>}
      <p className="public-course-notice">Danh sách trên là đề cương khóa học. Nội dung bài giảng và video chỉ dành cho học viên có quyền truy cập hợp lệ.</p>
    </section><aside id="course-packages" className="checkout" aria-label="Thông tin giá khóa học">
      {course.thumbnailUrl && <img className="public-course-cover" src={course.thumbnailUrl} alt={'Ảnh khóa học ' + course.title} />}
      {student && enrollment.isPending ? <p role="status">Đang kiểm tra đăng ký...</p> : student && enrollment.isError ? <div role="alert"><p>Không kiểm tra được trạng thái đăng ký.</p><button onClick={() => void enrollment.refetch()}>Thử lại</button></div> : enrollment.data?.hasAccess ? <div className="course-checkout-action"><p className="course-enrolled" role="status">Bạn đã đăng ký khóa học này.</p><p>Gói học: {enrollment.data.packageName ?? 'Gói đã đăng ký'}</p><p>{enrollment.data.lifetime ? 'Quyền học vĩnh viễn' : enrollment.data.validUntil ? `Hiệu lực đến ${new Date(enrollment.data.validUntil).toLocaleDateString('vi-VN')}` : 'Quyền học đang hoạt động'}</p><Link className="primary-button" to={`/student/courses/${id}/learn`}>Vào học</Link><Link to={`/student/registrations/${enrollment.data.registrationId}`}>Chi tiết đăng ký</Link></div> : enrollment.data?.status === 'PENDING_PAYMENT' ? <div className="course-checkout-action"><p role="status">Bạn đã đăng ký, đang chờ thanh toán.</p><p>Gói học: {enrollment.data.packageName ?? 'Gói đã đăng ký'}</p><Link className="primary-button" to={`/student/registrations/${enrollment.data.registrationId}/payment`}>Tiếp tục thanh toán</Link><Link to={`/student/registrations/${enrollment.data.registrationId}`}>Chi tiết đăng ký</Link></div> : <>
      <small>CHỌN GÓI HỌC</small>
      {packages.length === 0 ? <><p id="registration-unavailable">Expert chưa mở gói học để đăng ký.</p>{student && <button className="primary-button" disabled aria-describedby="registration-unavailable">Đăng ký khóa học</button>}</> : <><fieldset className="package-selector"><legend>Thời hạn truy cập</legend>{packages.map(p => <label key={p.id}><input type="radio" name="course-package" checked={p.id === selected?.id} onChange={() => setSelectedId(p.id)} /> {p.name} · {coursePrice(p.finalPrice)}</label>)}</fieldset>
        {selected && <><h2 className="course-price">{coursePrice(selected.finalPrice)}</h2>{selected.discountPercent > 0 && <p><del>{coursePrice(selected.price)}</del> · Giảm {selected.discountPercent}%</p>}
          <div className="course-checkout-action">{!user || student ? <Link className="primary-button" to={registerTo} onClick={() => { if (!user) sessionStorage.setItem('ols.registrationReturnTo', registerTo) }}>Đăng ký khóa học</Link> : <><button className="primary-button" disabled aria-describedby="student-registration-role-notice">Đăng ký khóa học</button><p id="student-registration-role-notice">Chỉ tài khoản Student được đăng ký khóa học. Vui lòng đăng nhập bằng tài khoản Student để tiếp tục.</p></>}
            {student && <p>Xác nhận thông tin đăng ký, sau đó thanh toán bằng QR chuyển khoản qua SePay.</p>}
          </div></>}
      </>}
      </>}
      <b>Khóa học bao gồm:</b><p>{course.lessons.length} bài học đang hiển thị<br />{course.quizCount} bài kiểm tra đang hoạt động</p>
      {!enrollment.data?.hasAccess && <p className="public-course-notice">Đăng ký được tạo ở trạng thái chờ thanh toán. Quyền học chỉ được cấp sau thanh toán thành công.</p>}
      <Link to="/courses">Xem các khóa học khác →</Link>
    </aside></div></div>
  </>
}
