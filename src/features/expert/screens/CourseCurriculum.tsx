import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../../shared/services/apiClient'
import { useAuth } from '../../../shared/context/AuthContext'
import { courseError } from './ExpertCoursesPage'
import './curriculum.css'

interface Quiz { id: number; title: string; active: boolean; questionCount: number; durationMinutes: number | null; passRate: number | null; maxAttempts: number | null }
interface Row { id: number; title: string; position: number; active: boolean; bankQuestions: number; quizzes: Quiz[] }
interface Outline { lessons: Row[]; courseQuizzes: Quiz[]; sharedQuestions: number }
export function CourseCurriculum({ courseId, editable }: { courseId: number; editable: boolean }) {
 const { user } = useAuth()
 const client = useQueryClient()
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
 const quizRow = (quiz: Quiz) => <li key={quiz.id} className="curriculum-quiz"><span aria-hidden="true">Q</span><div><Link to={`${base}/quizzes/${quiz.id}`}>{quiz.title}</Link><small>{quiz.questionCount} câu · {quiz.durationMinutes ?? '—'} phút · Đạt {quiz.passRate ?? '—'}% · {quiz.maxAttempts ?? '—'} lượt{!quiz.active && ' · Đang ẩn'}</small>{!quiz.questionCount && <small className="curriculum-warning">Chưa có câu hỏi</small>}</div>{editable && <Link to={`${base}/quizzes/${quiz.id}/edit`}>Sửa quiz</Link>}</li>
 return <section className="course-panel curriculum"><header className="course-heading"><div><h2>Giáo trình khóa học</h2><p>Sắp xếp bài học và theo dõi phân bổ quiz, câu hỏi trong cùng một nơi.</p></div><Link to={`${base}/questions`}>Ngân hàng câu hỏi</Link></header>
  {query.isPending && <p role="status">Đang tải giáo trình…</p>}
  {query.isError && <div role="alert"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div>}
  {order.isError && <div role="alert"><p className="course-error">{courseError(order.error)}</p><button onClick={() => { order.reset(); void query.refetch() }}>Tải lại giáo trình</button></div>}
  {order.isSuccess && <p role="status">Đã lưu thứ tự bài học.</p>}
  {query.data && <>
   <div className="curriculum-stats"><span><b>{query.data.lessons.length}</b> bài học</span><span><b>{query.data.lessons.reduce((sum, l) => sum + l.quizzes.length, query.data.courseQuizzes.length)}</b> quiz</span><span><b>{query.data.lessons.reduce((sum, l) => sum + l.bankQuestions, query.data.sharedQuestions)}</b> câu hỏi trong ngân hàng</span><span><b>{query.data.lessons.filter(l => l.active && !l.quizzes.some(q => q.active && q.questionCount > 0)).length}</b> bài chưa có quiz hoạt động</span></div>
   <label className="curriculum-search">Tìm trong giáo trình<input type="search" value={search} maxLength={200} onChange={e => setSearch(e.target.value)} placeholder="Tên bài học hoặc quiz…" /></label>
   <p className="curriculum-note">Thứ tự bên dưới cũng là thứ tự học viên nhìn thấy. Quiz gắn bài nằm sau bài đó; quiz toàn khóa nằm cuối. Có thể dùng câu hỏi của nhiều bài trong một quiz tổng hợp.</p>
   <ol className="curriculum-list">{query.data.lessons.map((lesson, index) => (!search.trim() || matches(lesson.title) || lesson.quizzes.some(q => matches(q.title))) && <li key={lesson.id} className="curriculum-lesson">
    <header><span className="curriculum-number">{index + 1}</span><div className="curriculum-title"><h3>{lesson.title}</h3><small>{lesson.active ? 'Đang hiển thị' : 'Đang ẩn'} · {lesson.bankQuestions} câu hỏi · {lesson.quizzes.length} quiz</small></div>{editable && <div className="curriculum-order"><button aria-label={`Đưa ${lesson.title} lên`} disabled={index === 0 || order.isPending || !!search.trim()} onClick={() => move(index, -1)}>↑</button><button aria-label={`Đưa ${lesson.title} xuống`} disabled={index + 1 === query.data.lessons.length || order.isPending || !!search.trim()} onClick={() => move(index, 1)}>↓</button></div>}</header>
    <div className="curriculum-links"><Link to={`${base}/questions?lessonId=${lesson.id}`}>Quản lý câu hỏi của bài</Link>{editable && <Link to={`${base}/quizzes/new?lessonId=${lesson.id}`}>+ Tạo quiz cho bài</Link>}</div>
    {lesson.quizzes.length ? <ul>{lesson.quizzes.map(quizRow)}</ul> : <p className="curriculum-empty">Chưa gắn quiz. Expert có thể thêm bài luyện tập tại đây.</p>}
   </li>)}</ol>
   {!query.data.lessons.length && <p>Chưa có bài học. Thêm bài học tại phần quản lý bên dưới để bắt đầu xây dựng giáo trình.</p>}
   {!!search.trim() && !query.data.lessons.some(l => matches(l.title) || l.quizzes.some(q => matches(q.title))) && !query.data.courseQuizzes.some(q => matches(q.title)) && <p>Không tìm thấy bài học hoặc quiz phù hợp.</p>}
   <section className="curriculum-course-wide"><h3>Đánh giá toàn khóa</h3><p>{query.data.sharedQuestions} câu hỏi dùng chung · Quiz tổng hợp được hiển thị cuối giáo trình.</p><div className="curriculum-links"><Link to={`${base}/questions?lessonId=0`}>Câu hỏi dùng chung</Link>{editable && <Link to={`${base}/quizzes/new`}>+ Tạo quiz toàn khóa</Link>}</div><ul>{query.data.courseQuizzes.filter(q => !search.trim() || matches(q.title)).map(quizRow)}</ul>{!query.data.courseQuizzes.length && <p className="curriculum-empty">Chưa có quiz tổng hợp toàn khóa.</p>}</section>
  </>}
 </section>
}
