import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../../shared/services/apiClient'
import { useAuth } from '../../../shared/context/AuthContext'
import { CourseDialog } from './CourseUi'
import { courseError } from './ExpertCoursesPage'
import './lesson-question-picker.css'

interface Choice { id: number; content: string; active: boolean; lessonIds: number[] }
interface Selection { questions: Choice[]; selectedIds: number[] }
interface Lesson { id: number; title: string; position: number }
interface Props { courseId: number; lesson: Lesson; lessons: Lesson[]; editable: boolean; onClose: () => void }

export function LessonQuestionPicker(props: Props) {
 const { user } = useAuth()
 const [busy, setBusy] = useState(false)
 const endpoint = `/expert/courses/${props.courseId}/curriculum/lessons/${props.lesson.id}/questions`
 const query = useQuery({ queryKey: ['lesson-question-selection', user?.id, props.courseId, props.lesson.id], queryFn: async () => (await apiClient.get<Selection>(endpoint)).data })
 return <CourseDialog title={`${props.editable ? 'Chọn câu hỏi' : 'Câu hỏi'} · ${props.lesson.title}`} onClose={() => { if (!busy) props.onClose() }}>
  {query.isPending ? <p role="status">Đang tải câu hỏi…</p> : query.isError ? <div role="alert"><p className="course-error">{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div>
   : <SelectionForm key={`${props.lesson.id}:${JSON.stringify(query.data)}`} {...props} initial={query.data} endpoint={endpoint} onBusy={setBusy} />}
 </CourseDialog>
}

function SelectionForm({ initial, endpoint, lesson, lessons, editable, onClose, onBusy }: Props & { initial: Selection; endpoint: string; onBusy: (busy: boolean) => void }) {
 const client = useQueryClient()
 const [selected, setSelected] = useState(() => new Set(initial.selectedIds))
 const [search, setSearch] = useState('')
 const dirty = selected.size !== initial.selectedIds.length || initial.selectedIds.some(id => !selected.has(id))
 const save = useMutation({ mutationFn: async () => { await apiClient.put(endpoint, { questionIds: [...selected], expectedQuestionIds: initial.selectedIds }) }, onSuccess: async () => {
  await Promise.all(['expert-course', 'expert-courses', 'published-courses', 'public-course', 'manager-course-changes', 'course-curriculum', 'lesson-question-selection', 'course-submission-readiness', 'expert-questions', 'quiz-question-bank'].map(key => client.invalidateQueries({ queryKey: [key] })))
  onClose()
 } })
 useEffect(() => { onBusy(save.isPending); return () => onBusy(false) }, [save.isPending, onBusy])
 function toggle(id: number) { setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next }) }
 async function submit(event: FormEvent) { event.preventDefault(); if (!editable || save.isPending || !dirty) return; try { await save.mutateAsync() } catch { /* The API error stays in the dialog. */ } }
 const visible = initial.questions.filter(question => (editable || selected.has(question.id)) && question.content.toLocaleLowerCase('vi-VN').includes(search.trim().toLocaleLowerCase('vi-VN')))
 return <form className="lesson-question-picker" onSubmit={event => void submit(event)}>
  <p>Một câu hỏi có thể dùng ở nhiều bài. Lựa chọn tại đây chỉ thay đổi câu hỏi của <b>{lesson.title}</b>.</p>
  <label>Tìm câu hỏi<input type="search" maxLength={200} value={search} onChange={event => setSearch(event.target.value)} placeholder="Nhập nội dung câu hỏi…" /></label>
  <p role="status" className="lesson-question-count">Đã chọn {selected.size} câu hỏi</p>
  {save.isError && <p role="alert" className="course-error">{courseError(save.error)}</p>}
  <div className="lesson-question-options">{visible.map(question => {
   const usedIn = lessons.filter(item => question.lessonIds.includes(item.id)).map(item => `${item.position}. ${item.title}`)
   const disabled = !editable || save.isPending || !question.active && !initial.selectedIds.includes(question.id)
   return <label key={question.id} className={`lesson-question-option ${selected.has(question.id) ? 'is-selected' : ''}`}>
    <input type="checkbox" checked={selected.has(question.id)} disabled={disabled} onChange={() => toggle(question.id)} />
    <span><span className="lesson-question-text">{question.content}</span><small>{usedIn.length ? `Đang dùng ở: ${usedIn.join('; ')}` : 'Chưa gắn với bài học nào'}{!question.active ? ' · Đã ngừng hoạt động' : ''}</small></span>
   </label>
  })}{!visible.length && <p>{initial.questions.length ? 'Không có câu hỏi phù hợp.' : 'Chưa có câu hỏi. Hãy soạn và lưu câu hỏi trước khi chọn cho bài học.'}</p>}</div>
  <div className="studio-dialog-actions"><button type="button" disabled={save.isPending} onClick={onClose}>{editable ? 'Hủy' : 'Đóng'}</button>{editable && <button className="course-primary" type="submit" disabled={!dirty || save.isPending}>{save.isPending ? 'Đang lưu…' : 'Lưu câu hỏi cho bài'}</button>}</div>
 </form>
}
