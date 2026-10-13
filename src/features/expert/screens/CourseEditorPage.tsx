import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCourseActions, useExpertCourse } from '../../../shared/hooks/useExpertCourses'
import { courseStatusLabels, type CourseInput, type ExpertCourse } from '../api/expertCourseApi'
import { courseError } from './ExpertCoursesPage'
import { CourseLessons } from './CourseLessons'
import { MediaUpload } from '../../../shared/components/media/MediaUpload'
import { CourseSubmissionPanel } from './CourseSubmissionPanel'
import { CoursePackagesPanel } from './CoursePackagesPanel'
import './courses.css'
export function CourseEditorPage() {
  const { courseId } = useParams()
  const id = courseId === undefined ? undefined : Number(courseId)
  const query = useExpertCourse(id)
  if (id !== undefined && (!Number.isSafeInteger(id) || id <= 0)) return <p role="alert">Mã khóa học không hợp lệ.</p>
  if (id !== undefined && query.isPending) return <p role="status">Đang tải khóa học…</p>
  if (id !== undefined && query.isError) return <div role="alert"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div>
  return <><CourseForm key={id ?? 'new'} course={query.data} />{query.data && <div className="expert-courses"><CourseLessons key={query.data.id} courseId={query.data.id} editable={query.data.status === 'DRAFT' || query.data.status === 'REJECTED'} /></div>}</>
}
function CourseForm({ course }: { course?: ExpertCourse }) {
  const navigate = useNavigate()
  const [form, setForm] = useState<CourseInput>({ title: course?.title ?? '', description: course?.description ?? '', category: course?.category ?? '', price: course?.price ?? 0, thumbnailMediaId: course?.thumbnailMediaId ?? null })
  const [thumbnail, setThumbnail] = useState(course?.thumbnailUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [packagesDirty, setPackagesDirty] = useState(false)
  const [packagesBusy, setPackagesBusy] = useState(false)
  const [message, setMessage] = useState('')
  const { save } = useCourseActions()
  const editable = !course || course.editable
  const busy = save.isPending || uploading || submitting || packagesBusy
  const dirty = !course || form.title !== course.title || form.description !== course.description || form.category !== course.category || form.price !== course.price || (form.thumbnailMediaId ?? null) !== (course.thumbnailMediaId ?? null)
  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('')
    if (busy) return
    try { const result = await save.mutateAsync({ id: course?.id, input: form }); setForm({ title: result.title, description: result.description, category: result.category, price: result.price, thumbnailMediaId: result.thumbnailMediaId }); setMessage('Đã lưu khóa học.'); if (!course) navigate(`/expert/courses/${result.id}`, { replace: true }) } catch { /* Error displayed below. */ }
  }
  return <section className="expert-courses"><Link to="/expert/courses">← Danh sách khóa học</Link><header className="course-heading"><div><h1>{course ? course.editable ? 'Chỉnh sửa khóa học' : 'Chi tiết khóa học' : 'Tạo khóa học'}</h1><p>Thông tin cơ bản của khóa học</p></div>{course && <span className={`course-status status-${course.status.toLowerCase()}`}>{courseStatusLabels[course.status]}</span>}</header>
    {course && <nav className="qm-actions" aria-label="Nội dung khóa học"><Link to={`/expert/courses/${course.id}/questions`}>Ngân hàng câu hỏi</Link><Link to={`/expert/courses/${course.id}/quizzes`}>Quản lý quiz</Link></nav>}
    {course?.rejectionReason && <p className="course-error">Lý do từ chối: {course.rejectionReason}</p>}{message && <p role="status" className="course-success">{message}</p>}{save.isError && <p role="alert" className="course-error">{courseError(save.error)}</p>}
    <section className="course-panel"><h2>Ảnh khóa học</h2>{thumbnail && <img className="media-preview" src={thumbnail} alt="Ảnh khóa học" />}{course && editable ? <MediaUpload purpose="COURSE_IMAGE" courseId={course.id} disabled={save.isPending || submitting} onBusy={setUploading} onUploaded={media => { setForm(c => ({ ...c, thumbnailMediaId: media.id })); setThumbnail(media.url ?? '') }} /> : !course && <p>Lưu bản nháp trước để tải ảnh khóa học.</p>}</section>
    <div className="course-editor-grid"><form className="course-panel" onSubmit={e => void saveCourse(e)}><fieldset disabled={!editable || busy}><label>Tên khóa học *<input required maxLength={255} value={form.title} onChange={e => setForm(c => ({ ...c, title: e.target.value }))} /></label><label>Danh mục *<input required maxLength={255} value={form.category} onChange={e => setForm(c => ({ ...c, category: e.target.value }))} /></label><label>Mô tả *<textarea required maxLength={4000} rows={10} value={form.description} onChange={e => setForm(c => ({ ...c, description: e.target.value }))} /></label><p>Giá đăng ký được cấu hình riêng tại phần Gói giá bên dưới.</p>{editable && <button className="course-primary" type="submit">{save.isPending ? 'Đang lưu…' : course ? 'Lưu thay đổi' : 'Lưu bản nháp'}</button>}</fieldset></form>
    <CourseSubmissionPanel course={course} dirty={dirty || packagesDirty} busy={busy} onBusy={setSubmitting} /></div>
    {course ? <CoursePackagesPanel id={course.id} disabled={!editable || save.isPending || uploading || submitting} onDirty={setPackagesDirty} onBusy={setPackagesBusy} /> : <p>Lưu bản nháp trước để cấu hình gói giá.</p>}
    </section>
}
