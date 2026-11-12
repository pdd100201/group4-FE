import { useState, type FormEvent } from 'react'
import { useLessonActions, useLessons } from '../../../shared/hooks/useLessons'
import type { Lesson, LessonInput } from '../api/lessonApi'
import { MediaUpload } from '../../../shared/components/media/MediaUpload'
import { MediaVideo } from '../../../shared/components/media/MediaVideo'
import { courseError } from './ExpertCoursesPage'
import { LessonQuestionPicker } from './LessonQuestionPicker'
import { normalizeNumberInput } from '../../../shared/utils/numberInput'
import './lessons.css'

export function CourseLessons({ courseId, editable }: { courseId: number; editable: boolean }) {
  const query = useLessons(courseId)
  const { save, remove } = useLessonActions(courseId)
  const [selection, setSelection] = useState<Lesson | 'new' | null>(null)
  const [questionLesson, setQuestionLesson] = useState<Lesson | null>(null)
  const [deleting, setDeleting] = useState<Lesson | null>(null)
  const [message, setMessage] = useState('')
  async function saveLesson(input: LessonInput) {
    const lesson = await save.mutateAsync({ courseId, id: selection && selection !== 'new' ? selection.id : undefined, input })
    setSelection(null); setMessage(`Đã lưu bài học “${lesson.title}”.`)
  }
  async function deleteLesson() {
    if (!deleting) return
    try { await remove.mutateAsync({ courseId, id: deleting.id }); setDeleting(null); setMessage('Đã xóa bài học.') } catch { /* Error displayed in the dialog. */ }
  }
  return <section className="course-panel course-lessons"><header className="course-heading"><div><h2>Nội dung bài học</h2><p>Bài học hiển thị theo thứ tự trong khóa học.</p></div>{editable && <button className="course-primary" onClick={() => { save.reset(); setSelection('new') }}>+ Thêm bài học</button>}</header>
    {message && <p role="status" className="course-success">{message}</p>}{!editable && <p>Khóa học hiện chỉ cho phép xem nội dung bài học.</p>}
    {query.isPending ? <p role="status">Đang tải bài học…</p> : query.isError ? <div role="alert"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div> : <>
      {query.data.length === 0 && <p>Chưa có bài học trong khóa học này.</p>}
      <div className="course-table-wrap"><table className="course-table"><thead><tr><th>Thứ tự</th><th>Tên bài học</th><th>Thao tác</th></tr></thead><tbody>{query.data.map(l => <tr key={l.id}><td>{l.position}</td><td>{l.title}</td><td><div className="course-row-actions"><button onClick={() => { save.reset(); setSelection(l) }}>{editable ? 'Xem / sửa' : 'Xem nội dung'}</button><button onClick={() => setQuestionLesson(l)}>{editable ? 'Chọn câu hỏi' : 'Xem câu hỏi'}</button>{editable && <button className="course-danger" onClick={() => { remove.reset(); setDeleting(l) }}>Xóa</button>}</div></td></tr>)}</tbody></table></div>
    </>}
    {questionLesson && <LessonQuestionPicker courseId={courseId} lesson={questionLesson} lessons={query.data ?? []} editable={editable} onClose={() => setQuestionLesson(null)} />}
    {selection && <LessonEditor key={selection === 'new' ? 'new' : selection.id} courseId={courseId} lesson={selection === 'new' ? undefined : selection} nextPosition={Math.max(0, ...(query.data ?? []).map(l => l.position ?? 0)) + 1} editable={editable} saving={save.isPending} error={save.isError ? courseError(save.error) : ''} onSave={saveLesson} onClose={() => setSelection(null)} />}
    {deleting && <div className="course-modal-backdrop"><section className="course-modal" role="dialog" aria-modal="true" aria-labelledby="delete-lesson-title"><h2 id="delete-lesson-title">Xóa bài học?</h2><p>Bạn muốn gỡ “{deleting.title}” khỏi giáo trình? Tiến độ và lịch sử học đã có vẫn được giữ lại. Khóa học cần được gửi duyệt lại sau khi cập nhật.</p>{remove.isError && <p className="course-error" role="alert">{courseError(remove.error)}</p>}<div className="course-row-actions"><button autoFocus disabled={remove.isPending} onClick={() => setDeleting(null)}>Hủy</button><button className="course-danger" disabled={remove.isPending} onClick={() => void deleteLesson()}>{remove.isPending ? 'Đang xóa…' : 'Xác nhận xóa'}</button></div></section></div>}
  </section>
}
function LessonEditor({ courseId, lesson, nextPosition, editable, saving, error, onSave, onClose }: { courseId: number; lesson?: Lesson; nextPosition: number; editable: boolean; saving: boolean; error: string; onSave: (input: LessonInput) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState<Omit<LessonInput, 'position'> & { position: string }>({ title: lesson?.title ?? '', content: lesson?.content ?? '', position: String(lesson?.position ?? nextPosition), videoMediaId: lesson?.videoMediaId ?? null })
  const [uploading, setUploading] = useState(false)
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (saving || uploading || !editable || form.position.trim() === '') return; try { await onSave({ ...form, position: Number(form.position) }) } catch { /* Parent mutation renders the error. */ } }
  return <div className="course-modal-backdrop"><form className="course-modal lesson-editor" role="dialog" aria-modal="true" aria-labelledby="lesson-editor-title" onSubmit={e => void submit(e)}>
    <h2 id="lesson-editor-title">{lesson ? editable ? 'Chỉnh sửa bài học' : 'Nội dung bài học' : 'Thêm bài học'}</h2>
    {error && <p role="alert" className="course-error">{error}</p>}
    <fieldset disabled={!editable || saving || uploading}>
      <label>Tên bài học *<input autoFocus required maxLength={255} value={form.title} onChange={e => setForm(c => ({ ...c, title: e.target.value }))} /></label>
      <label>Thứ tự *<input type="number" required min={1} max={2147483647} step={1} value={form.position} onChange={e => setForm(c => ({ ...c, position: normalizeNumberInput(e.target.value) }))} /></label>
      <label>Nội dung bài học *<textarea required maxLength={8000} rows={10} value={form.content} onChange={e => setForm(c => ({ ...c, content: e.target.value }))} /></label>
    </fieldset>
    <h3>Video bài học</h3>
    {form.videoMediaId && <MediaVideo key={form.videoMediaId} mediaId={form.videoMediaId} showRefresh={false} />}
    {editable && <MediaUpload purpose="LESSON_VIDEO" courseId={courseId} disabled={saving} onBusy={setUploading} onUploaded={media => setForm(c => ({ ...c, videoMediaId: media.id }))} />}
    {editable && form.videoMediaId && <button type="button" disabled={saving || uploading} onClick={() => setForm(c => ({ ...c, videoMediaId: null }))}>Gỡ video khỏi bài học</button>}
    <div className="course-row-actions"><button type="button" disabled={saving || uploading} onClick={onClose}>{editable ? 'Hủy' : 'Đóng'}</button>{editable && <button type="submit" className="course-primary" disabled={saving || uploading}>{saving ? 'Đang lưu…' : 'Lưu bài học'}</button>}</div>
  </form></div>
}
