import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../shared/services/apiClient'
import { useAuth } from '../../shared/context/AuthContext'
import type { QuestionInput } from '../questions/api/questionApi'
import { CourseDialog } from '../expert/screens/CourseUi'
import { QuizError } from './QuizShared'
import './course-quiz.css'

interface Item { questionId: number | null; points: number; question: QuestionInput & { imageUrl?: string | null } }
interface Assessment { id: number; lessonId?: number | null; title: string; durationMinutes: number; passRate: number; maxAttempts: number; active: boolean; retained: boolean; questions: Item[] }
interface Input { id: number | null; title: string; durationMinutes: number; passRate: number; maxAttempts: number; questions: Item[] }
const blankQuestion = (): Item => ({ questionId: null, points: 1, question: { content: '', type: 'SINGLE_CHOICE', explanation: '', active: true, imageMediaId: null, lessonId: null, options: Array.from({ length: 4 }, () => ({ content: '', correct: false })) } })

export function CourseQuizPanel({ courseId, editable, onDirty, onBusy }: { courseId: number; editable: boolean; onDirty: (dirty: boolean) => void; onBusy: (busy: boolean) => void }) {
  const { user } = useAuth()
  const client = useQueryClient()
  const endpoint = `/expert/courses/${courseId}/assessment`
  const key = ['course-assessment', user?.id, courseId]
  const query = useQuery({ queryKey: key, queryFn: async () => (await apiClient.get<Assessment[]>(endpoint)).data })
  const [deleting, setDeleting] = useState<Assessment | null>(null)
  const refresh = async () => { await Promise.all(['course-assessment', 'course-curriculum', 'course-submission-readiness', 'managed-quizzes', 'managed-quiz', 'expert-quiz-list', 'quiz-review', 'manager-course', 'moderation-courses'].map(k => client.invalidateQueries({ queryKey: [k] }))) }
  const remove = useMutation({ mutationFn: async (id: number) => { await apiClient.delete(`/expert/courses/${courseId}/quizzes/${id}`) }, onSuccess: async () => { setDeleting(null); await refresh() } })
  useEffect(() => { onBusy(remove.isPending); return () => onBusy(false) }, [remove.isPending, onBusy])
  return <section className="course-panel course-assessment"><header className="course-heading"><div><h2>Quiz cuối khóa</h2><p>Mỗi khóa học có một quiz riêng. Soạn câu hỏi và đáp án trực tiếp tại đây.</p></div></header>
    {query.isPending && <p role="status">Đang tải quiz của khóa học...</p>}
    {query.isError && <QuizError error={query.error} retry={() => void query.refetch()} />}
    {query.data && (query.data.length > 1 ? <><p className="course-error" role="alert">Khóa học cũ có {query.data.length} quiz. Giữ lại một quiz trước khi gửi duyệt. Quiz đã có lượt làm bài được bảo lưu và không thể xóa.</p>{query.data.map(quiz => <div className="assessment-legacy" key={quiz.id}><div><b>{quiz.title}</b><p>{quiz.questions.length} câu hỏi · {quiz.retained ? 'Đã có lượt làm bài' : 'Chưa có lượt làm bài'}</p></div>{editable && !quiz.retained && <button type="button" className="course-danger" onClick={() => { remove.reset(); setDeleting(quiz) }}>Xóa quiz này</button>}<details><summary>Xem câu hỏi</summary>{quiz.questions.map((q, index) => <p key={q.questionId}>{index + 1}. {q.question.content}</p>)}</details></div>)}</> : <AssessmentForm key={JSON.stringify(query.data)} initial={query.data[0]} editable={editable} onDirty={onDirty} onBusy={onBusy} save={async input => { const result = (await apiClient.put<Assessment>(endpoint, input)).data; client.setQueryData(key, [result]); await refresh() }} />)}
    {deleting && <CourseDialog title="Xóa quiz cũ?" onClose={() => { if (!remove.isPending) setDeleting(null) }}><p>Bạn muốn xóa quiz “{deleting.title}”? Thao tác này không thể hoàn tác.</p>{remove.isError && <QuizError error={remove.error} />}<div className="studio-dialog-actions"><button disabled={remove.isPending} onClick={() => setDeleting(null)}>Giữ lại</button><button className="course-danger" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id)}>Xác nhận xóa</button></div></CourseDialog>}
  </section>
}

function AssessmentForm({ initial, editable, onDirty, onBusy, save }: { initial?: Assessment; editable: boolean; onDirty: (dirty: boolean) => void; onBusy: (busy: boolean) => void; save: (input: Input) => Promise<void> }) {
  const seed: Input = initial ? { id: initial.id, title: initial.title, durationMinutes: initial.durationMinutes ?? 30, passRate: initial.passRate ?? 70, maxAttempts: initial.maxAttempts ?? 3, questions: initial.questions.map(q => ({ questionId: q.questionId, points: q.points, question: { ...q.question, explanation: q.question.explanation ?? '', active: true, lessonId: null } })) } : { id: null, title: 'Quiz cuối khóa', durationMinutes: 30, passRate: 70, maxAttempts: 3, questions: [] }
  const [form, setForm] = useState(seed)
  const [validation, setValidation] = useState('')
  const mutation = useMutation({ mutationFn: save })
  const locked = !editable || !!initial?.retained
  const needsNormalization = !!initial && (!initial.active || initial.lessonId != null || initial.questions.some(q => q.question.lessonId != null || !q.question.active))
  const dirty = !locked && (needsNormalization || JSON.stringify(form) !== JSON.stringify(seed))
  useEffect(() => { onDirty(dirty); return () => onDirty(false) }, [dirty, onDirty])
  useEffect(() => { onBusy(mutation.isPending); return () => onBusy(false) }, [mutation.isPending, onBusy])
  function question(index: number, change: Partial<QuestionInput>) { setForm(f => ({ ...f, questions: f.questions.map((q, i) => i === index ? { ...q, question: { ...q.question, ...change } } : q) })) }
  function move(index: number, direction: number) { setForm(f => { const rows = [...f.questions]; [rows[index], rows[index + direction]] = [rows[index + direction], rows[index]]; return { ...f, questions: rows } }) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setValidation('')
    if (locked || mutation.isPending) return
    if (!form.questions.length) { setValidation('Thêm ít nhất một câu hỏi trước khi lưu quiz.'); return }
    for (const [index, item] of form.questions.entries()) {
      const correct = item.question.options.filter(o => o.correct).length
      if (!correct || (item.question.type === 'SINGLE_CHOICE' && correct !== 1)) { setValidation(`Câu ${index + 1}: chọn đáp án đúng phù hợp với loại câu hỏi.`); return }
      if (new Set(item.question.options.map(o => o.content.trim().toLocaleLowerCase())).size !== 4) { setValidation(`Câu ${index + 1}: bốn đáp án không được trùng nhau.`); return }
    }
    try { await mutation.mutateAsync(form) } catch { /* Keep the draft on server validation or network errors. */ }
  }
  return <form className="assessment-form" onSubmit={event => void submit(event)}>
    {locked && <p className="assessment-note">{initial?.retained ? 'Quiz đã có lượt làm bài. Nội dung và kết quả được bảo lưu, không thể chỉnh sửa.' : 'Khóa học hiện chỉ cho phép xem quiz.'}</p>}
    {!initial && locked && <p>Khóa học chưa có quiz.</p>}
    <fieldset disabled={locked || mutation.isPending}><legend>Cấu hình quiz</legend><label>Tên quiz *<input required maxLength={255} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></label>
      <div className="assessment-config"><label>Thời lượng (phút)<input type="number" required min={1} max={2147483647} step={1} value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} /></label><label>Điểm đạt (%)<input type="number" required min={0} max={100} step={1} value={form.passRate} onChange={e => setForm(f => ({ ...f, passRate: Number(e.target.value) }))} /></label><label>Số lượt làm tối đa<input type="number" required min={1} max={2147483647} step={1} value={form.maxAttempts} onChange={e => setForm(f => ({ ...f, maxAttempts: Number(e.target.value) }))} /></label></div>
      <div className="assessment-summary"><h3>Câu hỏi ({form.questions.length}/200)</h3><span>Tổng điểm: {form.questions.reduce((sum, q) => sum + (q.points || 0), 0)}</span></div>
      {!form.questions.length && <p className="assessment-note">Thêm câu hỏi, nhập bốn đáp án và chọn đáp án đúng. Quiz sẽ xuất hiện cuối giáo trình của học viên.</p>}
      {form.questions.map((item, index) => <section className="assessment-question" key={index} aria-label={`Câu hỏi ${index + 1}`}><header><h3>Câu {index + 1}</h3>{!locked && <div className="assessment-order"><button type="button" aria-label={`Đưa câu ${index + 1} lên`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label={`Đưa câu ${index + 1} xuống`} disabled={index + 1 === form.questions.length} onClick={() => move(index, 1)}>↓</button><button type="button" className="course-danger" onClick={() => setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== index) }))}>Bỏ câu</button></div>}</header>
        <label>Nội dung câu hỏi *<textarea required maxLength={4000} rows={3} value={item.question.content} onChange={e => question(index, { content: e.target.value })} /></label>
        {item.question.imageUrl && <img className="assessment-image" src={item.question.imageUrl} alt={`Hình minh họa câu ${index + 1}`} />}
        <div className="assessment-config"><label>Loại câu hỏi<select value={item.question.type} onChange={e => { const type = e.target.value as QuestionInput['type']; question(index, { type, options: item.question.options.map(o => ({ ...o, correct: false })) }) }}><option value="SINGLE_CHOICE">Một đáp án đúng</option><option value="MULTIPLE_CHOICE">Nhiều đáp án đúng</option></select></label><label>Điểm câu hỏi<input type="number" required min={1} max={2147483647} step={1} value={item.points} onChange={e => setForm(f => ({ ...f, questions: f.questions.map((q, i) => i === index ? { ...q, points: Number(e.target.value) } : q) }))} /></label></div>
        <p className="assessment-help">{item.question.type === 'SINGLE_CHOICE' ? 'Chọn một đáp án đúng.' : 'Chọn tất cả đáp án đúng.'}</p>
        <div className="assessment-options">{item.question.options.map((option, optionIndex) => <div className={`assessment-option ${option.correct ? 'is-correct' : ''}`} key={optionIndex}><label className="assessment-correct"><input type={item.question.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'} name={`correct-${index}`} aria-label={`Câu ${index + 1}: đáp án ${String.fromCharCode(65 + optionIndex)} đúng`} checked={option.correct} onChange={e => question(index, { options: item.question.options.map((o, i) => ({ ...o, correct: item.question.type === 'SINGLE_CHOICE' ? i === optionIndex : i === optionIndex ? e.target.checked : o.correct })) })} /><span>{String.fromCharCode(65 + optionIndex)}</span></label><input aria-label={`Câu ${index + 1}: nội dung đáp án ${String.fromCharCode(65 + optionIndex)}`} required maxLength={255} value={option.content} onChange={e => question(index, { options: item.question.options.map((o, i) => i === optionIndex ? { ...o, content: e.target.value } : o) })} /></div>)}</div>
        <label>Giải thích đáp án<textarea maxLength={255} rows={2} value={item.question.explanation} onChange={e => question(index, { explanation: e.target.value })} /></label>
      </section>)}
      {!locked && <button type="button" disabled={form.questions.length >= 200} onClick={() => setForm(f => ({ ...f, questions: [...f.questions, blankQuestion()] }))}>+ Thêm câu hỏi</button>}
    </fieldset>
    {validation && <p className="course-error" role="alert">{validation}</p>}{mutation.isError && <QuizError error={mutation.error} />}
    {!locked && <div className="assessment-save"><span>{dirty ? 'Có thay đổi chưa lưu' : initial ? 'Quiz đã được lưu' : 'Chưa tạo quiz'}</span><button type="submit" className="course-primary" disabled={mutation.isPending || (!!initial && !dirty)}>{mutation.isPending ? 'Đang lưu...' : 'Lưu quiz và câu hỏi'}</button></div>}
  </form>
}
