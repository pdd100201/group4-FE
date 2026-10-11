import { Link, useParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { usePublicCourse } from '../../hooks/usePublicCourse'
import { coursePrice } from './PublicCourseCard'
import './public-courses.css'

export function CourseDetailPage() {
  const { courseId } = useParams()
  const id = Number(courseId)
  const query = usePublicCourse(id)
  if (!Number.isSafeInteger(id) || id <= 0) return <section className="landing-section"><h1>Mã khóa học không hợp lệ</h1><Link to="/courses">Quay lại danh sách khóa học</Link></section>
  if (query.isPending) return <section className="landing-section"><p role="status">Đang tải chi tiết khóa học…</p></section>
  if (query.isError) {
    const unavailable = isAxiosError(query.error) && query.error.response?.status === 404
    return <section className="landing-section" role="alert"><h1>{unavailable ? 'Khóa học không còn khả dụng' : 'Không tải được khóa học'}</h1>
      <p>{unavailable ? 'Khóa học không tồn tại, chưa được xuất bản hoặc đã được ẩn.' : 'Vui lòng kiểm tra kết nối và thử lại.'}</p>
      {!unavailable && <button onClick={() => void query.refetch()}>Thử lại</button>} <Link to="/courses">Quay lại danh sách khóa học</Link></section>
  }
  const course = query.data
  return <><section className="course-hero">
    <small><Link to="/">Trang chủ</Link> / <Link to="/courses">Khóa học</Link> / {course.category || 'Chưa phân loại'} / <b>{course.title}</b></small>
    <h1>{course.title}</h1><span>Giảng viên: <b>{course.expertName || 'Chưa cập nhật'}</b></span>
  </section>
    <div className="detail-layout"><section>
      <article className="learn-box"><h3>Thông tin khóa học</h3><p>Danh mục: {course.category || 'Chưa phân loại'}</p><p>{course.lessons.length} bài học đang hiển thị · {course.quizCount} bài kiểm tra đang hoạt động</p></article>
      <h2>Mô tả khóa học</h2><p className="public-course-description">{course.description || 'Giảng viên chưa cập nhật mô tả.'}</p>
      <h2>Nội dung khóa học</h2>
      {course.lessons.length === 0 ? <p>Chưa có bài học đang hiển thị.</p> : <ol className="public-course-outline">{course.lessons.map((lesson, index) =>
        <li className="curriculum" key={lesson.id}><b>{index + 1}. {lesson.title}</b><span>Bài học</span></li>)}</ol>}
      <p className="public-course-notice">Danh sách trên là đề cương khóa học. Nội dung bài giảng và video chỉ dành cho học viên có quyền truy cập hợp lệ.</p>
    </section><aside className="checkout" aria-label="Thông tin giá khóa học">
      {course.thumbnailUrl && <img className="public-course-cover" src={course.thumbnailUrl} alt={'Ảnh khóa học ' + course.title} />}
      <small>GIÁ KHÓA HỌC HIỆN TẠI</small><h1>{coursePrice(course.price)}</h1>
      <b>Khóa học bao gồm:</b><p>{course.lessons.length} bài học đang hiển thị<br />{course.quizCount} bài kiểm tra đang hoạt động</p>
      <p className="public-course-notice">Gói học và chức năng đăng ký/thanh toán chưa được triển khai. Trang này chưa hỗ trợ mua khóa học hoặc học thử.</p>
      <Link to="/courses">Xem các khóa học khác →</Link>
    </aside></div>
  </>
}
