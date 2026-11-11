import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCourseActions, useExpertCourse, useSubmissionReadiness } from '../../../shared/hooks/useExpertCourses'
import { courseStatusLabels, type CourseInput, type ExpertCourse } from '../api/expertCourseApi'
import { courseError } from './ExpertCoursesPage'
import { CourseCurriculum } from './CourseCurriculum'
import { CourseLessons } from './CourseLessons'
import { CourseQuizPanel } from '../../quiz/CourseQuizPanel'
import { MediaUpload } from '../../../shared/components/media/MediaUpload'
import { CourseSubmissionPanel } from './CourseSubmissionPanel'
import { CoursePackagesPanel } from './CoursePackagesPanel'
import { CourseDialog, CourseIcon } from './CourseUi'
import './courses.css'
import './course-studio.css'

const courseCategories = ['Lập trình', 'Công nghệ thông tin', 'Thiết kế', 'Ngoại ngữ', 'Kinh doanh', 'Marketing', 'Kỹ năng mềm']

const steps = [
 { id: 'info', title: 'Thông tin khóa học', description: 'Tên, giới thiệu & ảnh bìa', icon: 'info', codes: ['BASIC', 'THUMBNAIL'] },
 { id: 'content', title: 'Xây dựng giáo trình', description: 'Bài học, câu hỏi & quiz', icon: 'book', codes: ['LESSONS', 'QUIZZES'] },
 { id: 'pricing', title: 'Gói học & học phí', description: 'Thời hạn, giá & ưu đãi', icon: 'price', codes: ['PRICE', 'PACKAGES'] },
 { id: 'review', title: 'Kiểm tra & gửi duyệt', description: 'Sẵn sàng đến với học viên', icon: 'check', codes: [] },
] as const

export function CourseEditorPage() {
 const { courseId } = useParams()
 const id = courseId === undefined ? undefined : Number(courseId)
 const query = useExpertCourse(id)
 if (id !== undefined && (!Number.isSafeInteger(id) || id <= 0)) return <div className="expert-courses"><p className="course-error" role="alert">Mã khóa học không hợp lệ.</p><Link to="/expert/courses">Quay lại khóa học</Link></div>
 if (id !== undefined && query.isPending) return <div className="expert-courses studio-loading" role="status"><div className="studio-skeleton" /><p>Đang mở không gian soạn khóa học…</p></div>
 if (id !== undefined && query.isError) return <div className="expert-courses"><p className="course-error" role="alert">{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button> <Link to="/expert/courses">Danh sách khóa học</Link></div>
 return <CourseStudio key={id ?? 'new'} course={query.data} />
}
function CourseStudio({ course }: { course?: ExpertCourse }) {
 const navigate = useNavigate()
 const [params, setParams] = useSearchParams()
 const step = course && steps.some(s => s.id === params.get('step')) ? params.get('step')! : 'info'
 const [form, setForm] = useState<CourseInput>({ title: course?.title ?? '', description: course?.description ?? '', category: course?.category ?? '', price: course?.price ?? 0, thumbnailMediaId: course?.thumbnailMediaId ?? null })
 const [customCategory, setCustomCategory] = useState(() => Boolean(course?.category && !courseCategories.includes(course.category)))
 const [customCategoryDraft, setCustomCategoryDraft] = useState(() => course?.category && !courseCategories.includes(course.category) ? course.category : '')
 const [thumbnail, setThumbnail] = useState(course?.thumbnailUrl ?? '')
 const [uploading, setUploading] = useState(false)
 const [submitting, setSubmitting] = useState(false)
 const [packagesDirty, setPackagesDirty] = useState(false)
 const [quizDirty, setQuizDirty] = useState(false)
 const [quizBusy, setQuizBusy] = useState(false)
 const [packagesBusy, setPackagesBusy] = useState(false)
 const [message, setMessage] = useState('')
 const [leavingTo, setLeavingTo] = useState<string | null>(null)
 const { save } = useCourseActions()
 const readiness = useSubmissionReadiness(course?.id)
 const editable = !course || course.editable
 const contentEditable = !!course && (course.status === 'DRAFT' || course.status === 'REJECTED')
 const busy = save.isPending || uploading || submitting || packagesBusy || quizBusy
 const dirty = !course || form.title !== course.title || form.description !== course.description || form.category !== course.category || form.price !== course.price || (form.thumbnailMediaId ?? null) !== (course.thumbnailMediaId ?? null)
 const checks = readiness.data?.checks ?? []
 const completed = checks.filter(c => c.complete).length
 const progress = checks.length ? Math.round(completed * 100 / checks.length) : 0
 const hasUnsavedChanges = quizDirty || packagesDirty || (course ? dirty : !!(form.title || form.description || form.category || form.thumbnailMediaId))
 const currentIndex = steps.findIndex(s => s.id === step)
 useEffect(() => {
  if (!hasUnsavedChanges) return
  const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
  window.addEventListener('beforeunload', warn)
  return () => window.removeEventListener('beforeunload', warn)
 }, [hasUnsavedChanges])
 useEffect(() => {
  if (!hasUnsavedChanges) return
  const intercept = (event: MouseEvent) => {
   if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
   const link = event.target instanceof Element ? event.target.closest('a[href]') : null
   if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')) return
   const target = new URL(link.href)
   if (target.origin !== window.location.origin || target.pathname === window.location.pathname) return
   event.preventDefault(); event.stopPropagation()
   setLeavingTo(target.pathname + target.search + target.hash)
  }
  document.addEventListener('click', intercept, true)
  return () => document.removeEventListener('click', intercept, true)
 }, [hasUnsavedChanges])
 function selectStep(id: string) {
  if (busy || !course) return
  const next = new URLSearchParams(params); next.set('step', id); setParams(next, { replace: true })
 }
 async function saveCourse(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); setMessage('')
  if (busy || !editable) return
  try {
   const result = await save.mutateAsync({ id: course?.id, input: form })
   setForm({ title: result.title, description: result.description, category: result.category, price: result.price, thumbnailMediaId: result.thumbnailMediaId })
   setMessage(course?.status === 'PUBLISHED' && result.status === 'DRAFT'
    ? 'Đã lưu thay đổi thành bản nháp. Hãy vào Kiểm tra & gửi duyệt để gửi quản trị viên duyệt lại trước khi xuất bản.'
    : 'Đã lưu thông tin khóa học.')
   if (!course) navigate(`/expert/courses/${result.id}?step=info`, { replace: true })
  } catch { /* Keep the draft and render the request error. */ }
 }
 return <main className="expert-courses course-studio">
  <Link className="studio-back" to="/expert/courses"><CourseIcon name="back" /> Tất cả khóa học</Link>
  <header className="studio-header"><div><p className="studio-eyebrow">KHÔNG GIAN GIẢNG DẠY</p><h1>{course?.title ?? 'Tạo khóa học mới'}</h1><p>{course ? 'Biến kiến thức của bạn thành một hành trình học tập rõ ràng.' : 'Bắt đầu với thông tin cơ bản. Hoàn thiện nội dung theo từng bước.'}</p></div><div className="studio-header-status">{course && <Link to={`/expert/students/${course.id}`}>Danh sách học viên</Link>}{course && <span className={`course-status status-${course.status.toLowerCase()}`}>{courseStatusLabels[course.status]}</span>}{course?.status === 'PUBLISHED' && <Link to={`/courses/${course.id}`} target="_blank" rel="noreferrer">Xem trang khóa học ↗</Link>}</div></header>
  {course?.rejectionReason && <div className="studio-review-note" role="note"><CourseIcon name="info" /><div><b>Phản hồi từ quản lý</b><p>{course.rejectionReason}</p></div></div>}
  <div className="studio-layout">
   <aside className="studio-rail"><div className="studio-rail-title"><span>LỘ TRÌNH SOẠN KHÓA</span><small>{course ? `${completed}/${checks.length || '—'} điều kiện` : 'Bắt đầu tại đây'}</small></div>
    <nav aria-label="Các bước soạn khóa học">{steps.map((item, index) => {
     const relevant = checks.filter(c => (item.codes as readonly string[]).includes(c.code))
     const done = relevant.length > 0 && relevant.every(c => c.complete)
     return <button key={item.id} aria-current={step === item.id ? 'step' : undefined} disabled={busy || (!course && index > 0)} onClick={() => selectStep(item.id)}><span className={`studio-step-number ${done ? 'is-done' : ''}`}>{done ? <CourseIcon name="check" /> : `0${index + 1}`}</span><span><b>{item.title}</b><small>{item.description}</small></span>{step === item.id && <span className="studio-active-dot" />}</button>
    })}</nav>
    <div className="studio-rail-progress"><div><span>Mức độ sẵn sàng</span><b>{progress}%</b></div><progress max={100} value={progress} aria-label="Điều kiện gửi duyệt đã hoàn thành" /><p>{course ? 'Hoàn tất các điều kiện để gửi Manager xét duyệt.' : 'Lưu bản nháp để mở giáo trình, gói học và phần gửi duyệt.'}</p></div>
    <div className="studio-tip"><CourseIcon name="spark" /><b>Một bước nhỏ, một khóa học tốt hơn.</b><p>Chia bài ngắn, đặt tên rõ ràng và dùng quiz để giúp học viên củng cố kiến thức.</p></div>
   </aside>
   <div className="studio-body">
    <section hidden={step !== 'info'} aria-labelledby="studio-info-title"><div className="studio-section-heading"><span className="studio-section-icon"><CourseIcon name="info" /></span><div><p>BƯỚC 01</p><h2 id="studio-info-title">Ấn tượng đầu tiên bắt đầu ở đây</h2><span>Giúp học viên hiểu họ sẽ học được gì từ khóa học của bạn.</span></div></div>
     <form id="course-info-form" className="course-panel studio-info-form" onSubmit={e => void saveCourse(e)}><div className="studio-panel-heading"><h3>Thông tin cơ bản</h3><span>Các trường có * là bắt buộc</span></div><fieldset disabled={!editable || busy}>
      <label>Tên khóa học *<input autoFocus={!course} required maxLength={30} value={form.title} placeholder="Ví dụ: Java từ nền tảng đến thực hành" onChange={e => setForm(c => ({ ...c, title: e.target.value }))} /><small className="studio-field-hint">Ngắn gọn, cụ thể và dễ tìm kiếm.<span>{form.title.length}/30</span></small></label>
      <label>Danh mục *<select required value={customCategory ? '__other__' : form.category} onChange={event => {
       const selected = event.target.value
       setCustomCategory(selected === '__other__')
       setForm(current => ({ ...current, category: selected === '__other__' ? customCategoryDraft : selected }))
      }}><option value="" disabled>Chọn danh mục khóa học</option>{courseCategories.map(category => <option key={category} value={category}>{category}</option>)}<option value="__other__">Khác</option></select></label>
      {customCategory && <label>Tên danh mục khác *<input required maxLength={30} value={form.category} placeholder="Nhập tên danh mục" onChange={event => {
       setCustomCategoryDraft(event.target.value)
       setForm(current => ({ ...current, category: event.target.value }))
      }} /><small className="studio-field-hint">Nhập danh mục phù hợp với khóa học.<span>{form.category.length}/30</span></small></label>}
      <label>Giới thiệu khóa học *<textarea required maxLength={255} rows={5} value={form.description} placeholder="Khóa học dành cho ai? Sau khi học, học viên sẽ làm được gì?" onChange={e => setForm(c => ({ ...c, description: e.target.value }))} /><small className="studio-field-hint">Nêu mục tiêu và giá trị thực tế cho học viên.<span>{form.description.length}/255</span></small></label>
     </fieldset>
     <div className="studio-cover-section"><div><h3>Ảnh bìa khóa học</h3><p>Chọn hình ảnh rõ nét, liên quan đến nội dung giảng dạy.</p></div><div className="studio-cover-grid"><div className="studio-cover-preview">{thumbnail ? <img src={thumbnail} alt="Ảnh bìa khóa học" /> : <><CourseIcon name="image" /><span>Không gian cho ý tưởng của bạn</span><small>Ảnh bìa xuất hiện trên trang khám phá</small></>}</div><div>{editable ? <MediaUpload purpose="COURSE_IMAGE" courseId={course?.id} disabled={busy} onBusy={setUploading} onUploaded={media => { setForm(c => ({ ...c, thumbnailMediaId: media.id })); setThumbnail(media.url ?? '') }} /> : <p className="studio-muted">Ảnh bìa hiện tại của khóa học.</p>}</div></div></div>
     </form>
     {message && <p className="course-success" role="status">{message}</p>}{save.isError && <p className="course-error" role="alert">{courseError(save.error)}</p>}
     <div className="studio-actionbar"><span>{!course ? 'Bản nháp chỉ hiển thị trong không gian của bạn.' : dirty ? 'Có thay đổi chưa lưu' : 'Thông tin đã được lưu'}</span><div>{editable && <button className="course-primary" type="submit" form="course-info-form" disabled={busy || (!!course && !dirty)}>{save.isPending ? 'Đang lưu…' : course ? 'Lưu thay đổi' : 'Tạo bản nháp'}<CourseIcon name="check" /></button>}{course && <button disabled={busy || dirty} onClick={() => selectStep('content')}>Tiếp: Giáo trình <CourseIcon name="next" /></button>}</div></div>
    </section>
    {course && <>
     <section hidden={step !== 'content'} aria-label="Xây dựng giáo trình"><div className="studio-section-heading"><span className="studio-section-icon"><CourseIcon name="book" /></span><div><p>BƯỚC 02</p><h2>Một hành trình học có định hướng</h2><span>Tổ chức bài học và quiz để học viên tiến bộ từng bước.</span></div></div><CourseContent courseId={course.id} editable={contentEditable} busy={busy} onDirty={setQuizDirty} onBusy={setQuizBusy} /></section>
     <section hidden={step !== 'pricing'} aria-label="Gói học và học phí"><div className="studio-section-heading"><span className="studio-section-icon"><CourseIcon name="price" /></span><div><p>BƯỚC 03</p><h2>Gói học phù hợp với từng nhu cầu</h2><span>Thiết lập thời hạn truy cập, học phí và ưu đãi minh bạch.</span></div></div><CoursePackagesPanel id={course.id} disabled={!editable || save.isPending || uploading || submitting} onDirty={setPackagesDirty} onBusy={setPackagesBusy} /></section>
     <section hidden={step !== 'review'} aria-label="Kiểm tra và gửi duyệt"><div className="studio-section-heading"><span className="studio-section-icon"><CourseIcon name="check" /></span><div><p>BƯỚC 04</p><h2>Sẵn sàng chia sẻ kiến thức?</h2><span>Kiểm tra lần cuối trước khi gửi khóa học đến Manager.</span></div></div><CourseSubmissionPanel course={course} dirty={dirty || packagesDirty || quizDirty} busy={busy} onBusy={setSubmitting} onFix={selectStep} /></section>
     {step !== 'info' && <div className="studio-actionbar"><button disabled={busy} onClick={() => selectStep(steps[currentIndex - 1].id)}><CourseIcon name="back" /> Quay lại</button><span>Bước {currentIndex + 1} / 4</span>{currentIndex < 3 && <button className="course-primary" disabled={busy} onClick={() => selectStep(steps[currentIndex + 1].id)}>Tiếp: {currentIndex === 1 ? 'Gói học' : 'Kiểm tra'}<CourseIcon name="next" /></button>}</div>}
    </>}
   </div>
  </div>
  {leavingTo && <CourseDialog title="Bạn có thay đổi chưa lưu" onClose={() => setLeavingTo(null)}><p>Thông tin, gói học hoặc quiz đang chỉnh sửa chưa được lưu. Lưu nội dung trước khi rời trang để giữ các thay đổi.</p><div className="studio-dialog-actions"><button autoFocus onClick={() => setLeavingTo(null)}>Tiếp tục chỉnh sửa</button><button className="course-danger" onClick={() => navigate(leavingTo)}>Rời trang, bỏ thay đổi</button></div></CourseDialog>}
 </main>
}
function CourseContent({ courseId, editable, busy, onDirty, onBusy }: { courseId: number; editable: boolean; busy: boolean; onDirty: (dirty: boolean) => void; onBusy: (busy: boolean) => void }) {
 const [params, setParams] = useSearchParams()
 const tab = params.get('tab') === 'quiz' ? 'quiz' : params.get('tab') === 'lessons' ? 'lessons' : 'outline'
 const [lessonsVisited, setLessonsVisited] = useState(tab === 'lessons')
 function openTab(next: string) {
  if (busy) return
  if (next === 'lessons') setLessonsVisited(true)
  const nextParams = new URLSearchParams(params); nextParams.set('step', 'content'); nextParams.set('tab', next); setParams(nextParams, { replace: true })
 }
 return <section className="curriculum-workspace"><div className="curriculum-tabs" role="group" aria-label="Quản lý nội dung khóa học"><button disabled={busy} aria-pressed={tab === 'outline'} onClick={() => openTab('outline')}>Tổng quan giáo trình</button><button disabled={busy} aria-pressed={tab === 'lessons'} onClick={() => openTab('lessons')}>Bài học</button><button disabled={busy} aria-pressed={tab === 'quiz'} onClick={() => openTab('quiz')}>Quiz cuối khóa</button></div>
  <div hidden={tab !== 'outline'}><CourseCurriculum courseId={courseId} editable={editable} onOpenQuiz={() => openTab('quiz')} /></div>
  {(lessonsVisited || tab === 'lessons') && <div hidden={tab !== 'lessons'}><CourseLessons courseId={courseId} editable={editable} /></div>}
  <div hidden={tab !== 'quiz'}><CourseQuizPanel courseId={courseId} editable={editable} onDirty={onDirty} onBusy={onBusy} /></div>
 </section>
}
