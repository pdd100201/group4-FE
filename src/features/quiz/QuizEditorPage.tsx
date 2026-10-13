import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuizDetail, useQuizWorkspace, useQuizWrites, validId } from '../../shared/hooks/useQuizManagement'
import type { ManagedQuiz, QuizInput, QuizLesson } from '../../shared/types/quiz'
import { canManageQuiz, QuizError } from './QuizShared'

export function QuizEditorPage({ readOnly = false }: { readOnly?: boolean }) {
  const params = useParams()
  const location = useLocation()
  const courseId = validId(params.courseId)
  const quizId = validId(params.quizId)
  const workspace = useQuizWorkspace(courseId)
  const detail = useQuizDetail(courseId, quizId)
  const existing = params.quizId !== undefined
  if (courseId === null || (existing && quizId === null)) return <div className="qm-page"><p role="alert">Mã khóa học hoặc quiz không hợp lệ.</p></div>
  const locked = workspace.course.data ? !canManageQuiz(workspace.course.data.status) : true
  return <div className="qm-page"><Link to={`/expert/courses/${courseId}/quizzes`}>← Danh sách quiz</Link>
    <header className="qm-heading"><div><p className="qm-eyebrow">EDUPORTAL · QUIZ</p><h1>{readOnly ? 'Chi tiết quiz' : existing ? 'Chỉnh sửa quiz' : 'Tạo quiz'}</h1><p>{workspace.course.data?.title}</p></div></header>
    {(location.state as { quizSaved?: boolean } | null)?.quizSaved && <p className="qm-feedback qm-success" role="status">Đã lưu quiz thành công.</p>}
    {workspace.course.isPending && <p role="status">Đang tải khóa học...</p>}
    {workspace.course.isError && <QuizError error={workspace.course.error} retry={() => { void workspace.course.refetch() }} />}
    {existing && detail.isPending && <p role="status">Đang tải quiz...</p>}
    {existing && detail.isError && <QuizError error={detail.error} retry={() => { void detail.refetch() }} />}
    {workspace.course.data && (!existing || detail.data) && <>
      {locked && <p className="qm-feedback">Khóa học hiện chỉ cho phép xem quiz. Chỉnh sửa chỉ khả dụng khi khóa học ở trạng thái Nháp hoặc Bị từ chối.</p>}
      {readOnly || locked ? detail.data ? <ExpertQuizDetails quiz={detail.data} lessons={workspace.lessons.data ?? []} /> : null :
        workspace.lessons.isPending ? <p role="status">Đang tải bài học...</p> : workspace.lessons.isError ? <QuizError error={workspace.lessons.error} retry={() => { void workspace.lessons.refetch() }} /> :
        <QuizForm key={`${courseId}-${quizId ?? 'new'}`} courseId={courseId} initial={detail.data} lessons={workspace.lessons.data ?? []} />}
    </>}
  </div>
}
function ExpertQuizDetails({ quiz, lessons }: { quiz: ManagedQuiz; lessons: QuizLesson[] }) {
  return <section className="qm-panel"><h2>{quiz.title}</h2><dl className="qm-facts"><div><dt>Bài học</dt><dd>{quiz.lessonId === null ? 'Toàn khóa học' : lessons.find(l => l.id === quiz.lessonId)?.title ?? `#${quiz.lessonId}`}</dd></div><div><dt>Thời lượng</dt><dd>{quiz.durationMinutes ?? '—'} phút</dd></div><div><dt>Tỷ lệ đạt</dt><dd>{quiz.passRate ?? '—'}%</dd></div><div><dt>Số lượt tối đa</dt><dd>{quiz.maxAttempts ?? '—'}</dd></div><div><dt>Trạng thái</dt><dd>{quiz.active ? 'Hoạt động' : 'Không hoạt động'}</dd></div></dl><h2>Câu hỏi ({quiz.questions.length})</h2>{quiz.questions.length === 0 && <p className="qm-empty">Quiz chưa có câu hỏi.</p>}{quiz.questions.map(q => <article key={q.questionId} className="qm-question"><strong>Câu {q.position} · #{q.questionId} · {q.points} điểm</strong><p className="qm-text">{q.content}</p></article>)}</section>
}
interface QuestionDraft { key: string; questionId: string; position: string; points: string; content?: string }
function QuizForm({ courseId, initial, lessons }: { courseId: number; initial?: ManagedQuiz; lessons: QuizLesson[] }) {
  const navigate = useNavigate()
  const { save } = useQuizWrites(courseId)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [duration, setDuration] = useState(String(initial?.durationMinutes ?? ''))
  const [passRate, setPassRate] = useState(String(initial?.passRate ?? ''))
  const [attempts, setAttempts] = useState(String(initial?.maxAttempts ?? ''))
  const [active, setActive] = useState(initial?.active ?? false)
  const [lessonId, setLessonId] = useState(initial?.lessonId?.toString() ?? '')
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => initial?.questions.map(q => ({ key: crypto.randomUUID(), questionId: String(q.questionId), position: String(q.position), points: String(q.points), content: q.content })) ?? [])
  const [validation, setValidation] = useState('')
  const busy = save.isPending
  function changeQuestion(key: string, field: 'questionId' | 'position' | 'points', value: string) {
    setQuestions(rows => rows.map(row => row.key === key ? { ...row, [field]: value, ...(field === 'questionId' ? { content: undefined } : {}) } : row))
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setValidation(''); save.reset()
    const positiveInteger = (value: string) => validId(value) !== null
    if (!title.trim()) { setValidation('Vui lòng nhập tên quiz.'); return }
    if (!positiveInteger(duration) || !positiveInteger(attempts) || passRate.trim() === '' || !Number.isInteger(Number(passRate)) || Number(passRate) < 0 || Number(passRate) > 100) {
      setValidation('Nhập thời lượng và số lượt là số nguyên dương; tỷ lệ đạt là số nguyên từ 0 đến 100.'); return
    }
    if (Number(duration) > 2147483647 || Number(attempts) > 2147483647) { setValidation('Thời lượng hoặc số lượt vượt giới hạn cho phép.'); return }
    if (lessonId && !lessons.some(l => String(l.id) === lessonId)) { setValidation('Bài học không còn thuộc khóa học này. Vui lòng chọn lại.'); return }
    if (questions.some(q => !positiveInteger(q.questionId) || !positiveInteger(q.position) || !positiveInteger(q.points) || Number(q.position) > 2147483647 || Number(q.points) > 2147483647)) {
      setValidation('Mã câu hỏi, thứ tự và điểm phải là số nguyên dương hợp lệ.'); return
    }
    if (new Set(questions.map(q => Number(q.questionId))).size !== questions.length || new Set(questions.map(q => Number(q.position))).size !== questions.length) {
      setValidation('Không được lặp mã câu hỏi hoặc thứ tự trong quiz.'); return
    }
    const input: QuizInput = { title: title.trim(), durationMinutes: Number(duration), passRate: Number(passRate), maxAttempts: Number(attempts), active, lessonId: lessonId ? Number(lessonId) : null,
      questions: questions.map(q => ({ questionId: Number(q.questionId), position: Number(q.position), points: Number(q.points) })) }
    try {
      const result = await save.mutateAsync({ id: initial?.id ?? null, input })
      navigate(`/expert/courses/${courseId}/quizzes/${result.id}`, { state: { quizSaved: true } })
    } catch { /* Keep user input and display the backend's ownership/state/retention error. */ }
  }
  return <form className="qm-panel qm-editor" onSubmit={event => { void submit(event) }}>
    <fieldset disabled={busy}><legend>Thông tin quiz</legend>
      <label>Tên quiz <span aria-hidden="true">*</span><input required maxLength={255} value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tên bài kiểm tra" /></label>
      <div className="qm-form-grid"><label>Thời lượng (phút)<input type="number" required min={1} max={2147483647} step={1} value={duration} onChange={e => setDuration(e.target.value)} /></label><label>Tỷ lệ đạt (%)<input type="number" required min={0} max={100} step={1} value={passRate} onChange={e => setPassRate(e.target.value)} /></label><label>Số lượt làm tối đa<input type="number" required min={1} max={2147483647} step={1} value={attempts} onChange={e => setAttempts(e.target.value)} /></label></div>
      <div className="qm-form-grid"><label>Gắn bài học<select value={lessonId} onChange={e => setLessonId(e.target.value)}><option value="">Không gắn bài học — thuộc toàn khóa học</option>{lessons.map(l => <option key={l.id} value={l.id}>{l.position}. {l.title}{l.active ? '' : ' (Không hoạt động)'}</option>)}</select></label><label>Trạng thái<select value={String(active)} onChange={e => setActive(e.target.value === 'true')}><option value="false">Không hoạt động</option><option value="true">Hoạt động</option></select></label></div>
      <h2>Câu hỏi trong quiz</h2><p className="qm-muted">Nhập mã câu hỏi có sẵn trong ngân hàng của khóa học. Bạn có thể lưu quiz chưa có câu hỏi để tiếp tục soạn sau.</p>
      {questions.length === 0 && <p className="qm-empty">Chưa gắn câu hỏi nào.</p>}
      {questions.map((q, index) => <div className="qm-question" key={q.key}><div className="qm-question-fields"><label>Mã câu hỏi<input aria-label={`Mã câu hỏi dòng ${index + 1}`} type="number" required min={1} step={1} value={q.questionId} onChange={e => changeQuestion(q.key, 'questionId', e.target.value)} /></label><label>Thứ tự<input aria-label={`Thứ tự dòng ${index + 1}`} type="number" required min={1} step={1} value={q.position} onChange={e => changeQuestion(q.key, 'position', e.target.value)} /></label><label>Điểm<input aria-label={`Điểm dòng ${index + 1}`} type="number" required min={1} step={1} value={q.points} onChange={e => changeQuestion(q.key, 'points', e.target.value)} /></label><button type="button" className="qm-danger" onClick={() => setQuestions(rows => rows.filter(row => row.key !== q.key))}>Bỏ câu hỏi</button></div>{q.content && <p className="qm-text">{q.content}</p>}</div>)}
      <button type="button" onClick={() => setQuestions(rows => [...rows, { key: crypto.randomUUID(), questionId: '', position: String(Math.max(0, ...rows.map(q => Number(q.position) || 0)) + 1), points: '1' }])}>+ Thêm câu hỏi</button>
    </fieldset>
    {validation && <p className="qm-feedback qm-error" role="alert">{validation}</p>}
    {save.isError && <QuizError error={save.error} />}
    <p className="qm-muted">Quiz đã có lượt làm bài hoặc kết quả cần lưu giữ sẽ không được sửa. Máy chủ kiểm tra trước khi lưu.</p>
    <div className="qm-form-actions"><button type="button" disabled={busy} onClick={() => navigate(`/expert/courses/${courseId}/quizzes`)}>Hủy</button><button className="primary-button" disabled={busy} type="submit">{busy ? 'Đang lưu...' : initial ? 'Lưu thay đổi' : 'Tạo quiz'}</button></div>
  </form>
}
