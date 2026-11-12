import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../../shared/services/apiClient'
import { useAuth } from '../../../shared/context/AuthContext'
import { courseError } from './ExpertCoursesPage'
import { LessonQuestionPicker } from './LessonQuestionPicker'
import './lesson-question-picker.css'
import './curriculum.css'

interface Quiz { id: number; title: string; active: boolean; questionCount: number; durationMinutes: number | null; passRate: number | null; maxAttempts: number | null }
interface Row { id: number; title: string; position: number; active: boolean; bankQuestions: number; quizzes: Quiz[] }
interface QuestionItem { id: number; quizId: number | null; position: number | null; content: string; lessonIds: number[] }
interface Outline { lessons: Row[]; courseQuizzes: Quiz[]; sharedQuestions: number; questions: QuestionItem[] }
export function CourseCurriculum({ courseId, editable, onOpenQuiz }: { courseId: number; editable: boolean; onOpenQuiz: () => void }) {
 const { user } = useAuth()
 const client = useQueryClient()
 const [questionLesson, setQuestionLesson] = useState<Row | null>(null)
 const [search, setSearch] = useState('')
 const base = `/expert/courses/${courseId}`
 const query = useQuery({ queryKey: ['course-curriculum', user?.id, courseId], queryFn: async () => (await apiClient.get<Outline>(`${base}/curriculum`)).data })
 const order = useMutation({ mutationFn: async ({ ids, expected }: { ids: number[]; expected: number[] }) => (await apiClient.put(`${base}/curriculum/order`, { lessonIds: ids, expectedLessonIds: expected })).data,
  onSuccess: async () => { await Promise.all(['course-curriculum', 'lessons', 'quiz-lessons', 'course-submission-readiness'].map(key => client.invalidateQueries({ queryKey: [key] }))) } })
 function move(index: number, step: number) {
  if (!query.data || order.isPending) return
  const expected = query.data.lessons.map(l => l.id), ids = [...expected]
  ;[ids[index], ids[index + step]] = [ids[index + step], ids[index]]
  order.mutate({ ids, expected })
 }
 const matches = (text: string) => text.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
 const allQuizzes = query.data ? [...query.data.courseQuizzes, ...query.data.lessons.flatMap(l => l.quizzes)] : []
 return <section className="course-panel curriculum"><header className="course-heading"><div><h2>Giáo trình khóa học</h2><p>Sắp xếp bài học và xem câu hỏi tương ứng của từng bài.</p></div><button type="button" onClick={onOpenQuiz}>Soạn câu hỏi</button></header>
  {query.isPending && <p role="status">Đang tải giáo trình...</p>}
  {query.isError && <div role="alert"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div>}
  {order.isError && <p className="course-error" role="alert">{courseError(order.error)}</p>}
  {order.isSuccess && <p role="status">Đã lưu thứ tự bài học.</p>}
  {query.data && <>
   <div className="curriculum-stats"><span><b>{query.data.lessons.length}</b> bài học</span><span><b>{query.data.questions.length}</b> câu hỏi</span></div>
   <label className="curriculum-search">Tìm bài học<input type="search" value={search} maxLength={200} onChange={e => setSearch(e.target.value)} placeholder="Tên bài học..." /></label>
   <p className="curriculum-note">Học viên học các bài theo thứ tự bên dưới, sau đó làm bộ câu hỏi.</p>
   <ol className="curriculum-list">{query.data.lessons.map((lesson, index) => (!search.trim() || matches(lesson.title)) && <li key={lesson.id} className="curriculum-lesson"><header><span className="curriculum-number">{index + 1}</span><div className="curriculum-title"><h3>{lesson.title}</h3><small>{query.data.questions.filter(question => question.lessonIds.includes(lesson.id)).length} câu hỏi</small></div><div className="curriculum-order"><button className="lesson-question-open" onClick={() => setQuestionLesson(lesson)}>{editable ? 'Chọn câu hỏi' : 'Xem câu hỏi'}</button>{editable && <><button aria-label={`Đưa ${lesson.title} lên`} disabled={index === 0 || order.isPending || !!search.trim()} onClick={() => move(index, -1)}>↑</button><button aria-label={`Đưa ${lesson.title} xuống`} disabled={index + 1 === query.data.lessons.length || order.isPending || !!search.trim()} onClick={() => move(index, 1)}>↓</button></>}</div></header><QuestionList questions={query.data.questions.filter(question => question.lessonIds.includes(lesson.id))} /></li>)}</ol>
   {!query.data.lessons.length && <p>Chưa có bài học. Chọn tab Bài học để thêm nội dung.</p>}
   {!!search.trim() && !query.data.lessons.some(l => matches(l.title)) && <p>Không tìm thấy bài học phù hợp.</p>}
   <section className="curriculum-course-wide"><h3>Câu hỏi</h3><p>Bấm Chọn câu hỏi ở mỗi bài để gắn các câu đã soạn. Một câu có thể dùng ở nhiều bài. Những câu chưa được chọn cho bài nào nằm bên dưới.</p><QuestionList questions={query.data.questions.filter(question => question.lessonIds.length === 0)} general />{allQuizzes.map(q => <p key={q.id}><b>{q.title.trim().toLocaleLowerCase('vi-VN') === 'quiz cuối khóa' ? 'Câu hỏi' : q.title}</b> · {q.questionCount} câu · {q.durationMinutes ?? '-'} phút · Đạt {q.passRate ?? '-'}%</p>)}<button type="button" onClick={onOpenQuiz}>{allQuizzes.length ? 'Xem / chỉnh sửa câu hỏi' : 'Tạo câu hỏi'}</button></section>
  </>}
  {questionLesson && <LessonQuestionPicker courseId={courseId} lesson={questionLesson} lessons={query.data?.lessons ?? []} editable={editable} onClose={() => setQuestionLesson(null)} />}
 </section>
}

function QuestionList({ questions, general = false }: { questions: QuestionItem[]; general?: boolean }) {
 return <details className="curriculum-question-group">
  <summary>{general ? 'Câu hỏi chung' : 'Xem câu hỏi của bài'} ({questions.length})</summary>
  {questions.length ? <ol>{questions.map(question => <li key={question.id}>{question.content}</li>)}</ol> : <p style={{ fontSize: 13 }}>Chưa có câu hỏi {general ? 'chung' : 'gắn với bài học này'}.</p>}
 </details>
}
