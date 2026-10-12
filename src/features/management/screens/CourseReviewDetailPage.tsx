import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCourseDecision, useManagerCourse } from '../../../shared/hooks/useManagerCourses'
import { courseStatusLabels } from '../../expert/api/expertCourseApi'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import { MediaVideo } from '../../../shared/components/media/MediaVideo'
import '../../expert/screens/courses.css'
import './review.css'

export function CourseReviewDetailPage() {
  const { courseId } = useParams()
  const id = Number(courseId)
  const query = useManagerCourse(id)
  const decision = useCourseDecision()
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  if (!Number.isSafeInteger(id) || id <= 0) return <p role="alert">Mã khóa học không hợp lệ.</p>
  if (query.isPending) return <p role="status">Đang tải nội dung…</p>
  if (query.isError) return <div role="alert"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div>
  const course = query.data
  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!action || (action === 'reject' && !reason.trim())) return
    try {
      await decision.mutateAsync({ id, action, reason: reason.trim() })
      setMessage(action === 'approve' ? 'Đã duyệt và xuất bản khóa học.' : 'Đã từ chối khóa học. Expert có thể sửa và gửi lại.'); setAction(null); setReason('')
    } catch { /* Error is displayed in the confirmation dialog. */ }
  }
  return <section className="expert-courses"><Link to="/manager/courses/review">← Danh sách xét duyệt</Link><header className="course-heading"><div><h1>{course.title}</h1><p>Expert: {course.expertName} · Mã #{course.id}</p></div><span className={`course-status status-${course.status.toLowerCase()}`}>{courseStatusLabels[course.status]}</span></header>
    {message && <p className="course-success" role="status">{message}</p>}
    {course.thumbnailUrl && <img className="media-preview" src={course.thumbnailUrl} alt="Ảnh khóa học" />}
    {course.lessons.some(l => l.videoMediaId) && <section className="course-panel"><h2>Video bài học</h2>{course.lessons.filter(l => l.videoMediaId).map(l => <details key={l.id}><summary>{l.title}</summary><MediaVideo mediaId={l.videoMediaId!} /></details>)}</section>}
    <div className="course-editor-grid"><div className="review-content"><section className="course-panel"><h2>Thông tin khóa học</h2><p>Danh mục: {course.category || 'Chưa có'}</p><p>Giá: {(course.price ?? 0).toLocaleString('vi-VN')} ₫</p><p className="review-text">{course.description || 'Chưa có mô tả.'}</p></section>
      <section className="course-panel"><h2>Nội dung bài học ({course.lessons.length})</h2>{course.lessons.length === 0 && <p>Khóa học chưa có bài học.</p>}{course.lessons.map(l => <details className="review-item" key={l.id}><summary>{l.title} · {l.active ? 'Đang hiển thị' : 'Đã ẩn'}</summary><p className="review-text">{l.content || 'Chưa có nội dung.'}</p></details>)}</section>
      <section className="course-panel"><h2>Bài kiểm tra ({course.quizzes.length})</h2>{course.quizzes.length === 0 && <p>Khóa học chưa có bài kiểm tra.</p>}{course.quizzes.map(q => <details className="review-item" key={q.id}><summary>{q.title} · {q.active ? 'Đang hiển thị' : 'Đã ẩn'}</summary><p>Thời lượng: {q.durationMinutes ?? 'Chưa cấu hình'} phút · Tỷ lệ đạt: {q.passRate ?? 'Chưa cấu hình'}% · Số lần thử: {q.maxAttempts ?? 'Chưa cấu hình'}</p>{q.questions.length === 0 && <p>Chưa có câu hỏi.</p>}{q.questions.map((question, index) => <article className="review-question" key={question.id}><h3>Câu {index + 1} · {question.points ?? 0} điểm</h3><p className="review-text">{question.content}</p><ul>{question.options.map(option => <li key={option.id}>{option.content}{option.correct && <span className="review-correct"> · Đáp án đúng</span>}</li>)}</ul>{question.explanation && <p className="review-text">Giải thích: {question.explanation}</p>}</article>)}</details>)}</section></div>
      <aside className="course-panel"><h2>Xét duyệt</h2><p>Manager xem trước nội dung và ghi nhận quyết định xét duyệt.</p>{course.reviewedBy && <p>Người xét duyệt: {course.reviewedBy}</p>}{course.rejectionReason && <p className="course-error">Lý do từ chối: {course.rejectionReason}</p>}{course.status === 'PENDING_REVIEW' ? <div className="review-actions"><button className="course-primary" disabled={decision.isPending} onClick={() => { decision.reset(); setAction('approve') }}>Duyệt và xuất bản</button><button className="course-danger" disabled={decision.isPending} onClick={() => { decision.reset(); setAction('reject') }}>Từ chối khóa học</button></div> : <p>Khóa học không ở trạng thái Chờ duyệt nên không thể xét duyệt lại.</p>}</aside></div>
    {action && <div className="course-modal-backdrop"><form className="course-modal" role="dialog" aria-modal="true" aria-labelledby="review-confirm-title" onSubmit={e => void confirm(e)}><h2 id="review-confirm-title">{action === 'approve' ? 'Duyệt và xuất bản khóa học?' : 'Từ chối khóa học'}</h2>{action === 'approve' ? <p>Sau khi xác nhận, khóa học sẽ được xuất bản và hiển thị trong danh mục công khai.</p> : <label>Lý do từ chối *<textarea autoFocus required maxLength={255} rows={5} disabled={decision.isPending} value={reason} onChange={e => setReason(e.target.value)} placeholder="Nội dung cần Expert chỉnh sửa" /></label>}{decision.isError && <p role="alert" className="course-error">{courseError(decision.error)}</p>}<div className="course-row-actions"><button type="button" autoFocus={action === 'approve'} disabled={decision.isPending} onClick={() => { setAction(null); setReason('') }}>Hủy</button><button type="submit" className={action === 'approve' ? 'course-primary' : 'course-danger'} disabled={decision.isPending || (action === 'reject' && !reason.trim())}>{decision.isPending ? 'Đang xử lý…' : 'Xác nhận'}</button></div></form></div>}
  </section>
}
