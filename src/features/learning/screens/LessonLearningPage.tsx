import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { MediaVideo } from '../../../shared/components/media/MediaVideo'
import { validId } from '../../../shared/hooks/useQuizManagement'
import { SafePostContent } from '../../blog/screens/SafePostContent'
import { learningApi } from '../api/learningApi'
import './learning.css'
import './student-quiz.css'

export function LessonLearningPage() {
  const { courseId: rawCourse, lessonId: rawLesson } = useParams()
  const courseId = validId(rawCourse), lessonId = validId(rawLesson)
  const { user } = useAuth()
  const client = useQueryClient()
  const [search, setSearch] = useState('')
  const [syllabus, setSyllabus] = useState(true)
  const valid = courseId !== null && (rawLesson === undefined || lessonId !== null)
  const key = ['student-learning', user?.id, courseId, lessonId]
  const query = useQuery({ queryKey: key, queryFn: () => learningApi.read(courseId!, lessonId), enabled: valid, retry: false })
  const complete = useMutation({ mutationFn: (id: number) => learningApi.complete(courseId!, id), onSuccess: async data => {
    client.setQueryData(key, data)
    await client.invalidateQueries({ queryKey: ['student-learning', user?.id, courseId] })
  } })
  if (!valid) return <main className="learning-page"><p role="alert">Mã khóa học hoặc bài học không hợp lệ.</p></main>
  if (query.isPending) return <main className="learning-page"><p role="status">Đang tải bài học...</p></main>
  if (query.isError) return <main className="learning-page"><div role="alert"><h1>Không mở được bài học</h1><p>{isAxiosError(query.error) && query.error.response?.status === 403 ? 'Đăng ký chưa được kích hoạt hoặc quyền học đã hết hạn.' : isAxiosError(query.error) && query.error.response?.status === 404 ? 'Khóa học hoặc bài học không còn khả dụng.' : 'Không tải được nội dung. Vui lòng thử lại.'}</p><button onClick={() => void query.refetch()}>Thử lại</button> <Link to="/student/registrations">Đăng ký của tôi</Link></div></main>
  const data = query.data, lesson = data.currentLesson
  const index = data.lessons.findIndex(item => item.id === lesson?.id)
  const previous = data.lessons[index-1], next = data.lessons[index+1]
  const completed = data.lessons[index]?.completed
  const to = (id: number) => `/student/courses/${courseId}/lessons/${id}`
  return <main className="learning-page"><header className="learning-heading"><div><Link to="/student/courses">← Khóa học của tôi</Link><h1>{data.courseTitle}</h1><p>Giảng viên: {data.expertName}</p></div><div className="learning-progress"><span>{data.completedLessons}/{data.lessons.length} bài hoàn thành · {data.progressPercent}%</span><progress value={data.progressPercent} max={100} aria-label="Tiến độ khóa học" /></div></header>
    <div className={`learning-workspace ${syllabus ? '' : 'syllabus-hidden'}`}><aside className="learning-syllabus"><div className="learning-syllabus-title"><h2>Nội dung khóa học</h2><button onClick={() => setSyllabus(false)} title="Ẩn đề cương" aria-label="Ẩn đề cương">×</button></div><input type="search" aria-label="Tìm bài học" placeholder="Tìm bài học..." value={search} maxLength={200} onChange={event => setSearch(event.target.value)} /><nav aria-label="Bài học">{data.lessons.filter(item => item.title.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map((item,i) => <Link key={item.id} to={to(item.id)} aria-current={item.id === lesson?.id ? 'page' : undefined}><span className="learning-lesson-number">{item.completed ? '✓' : item.position ?? i+1}</span><span>{item.title}</span>{item.completed && <small>Hoàn thành</small>}</Link>)}</nav></aside>
      <section className="learning-content">{!syllabus && <button onClick={() => setSyllabus(true)}>Nội dung khóa học</button>}{lesson ? <><div className="learning-lesson-heading"><small>Bài {index+1}/{data.lessons.length}</small><h2>{lesson.title}</h2></div>
        {lesson.videoMediaId !== null ? <MediaVideo key={lesson.videoMediaId} mediaId={lesson.videoMediaId} /> : <p className="learning-no-video">Bài học này chưa có video.</p>}
        <nav className="learning-actions" aria-label="Điều hướng bài học">{previous ? <Link to={to(previous.id)}>← Bài trước</Link> : <button disabled>← Bài trước</button>}<button className={completed ? 'lesson-completed' : 'primary-button'} disabled={completed || complete.isPending} onClick={() => complete.mutate(lesson.id)}>{completed ? '✓ Đã hoàn thành' : complete.isPending ? 'Đang lưu...' : 'Đánh dấu hoàn thành'}</button>{next ? <Link to={to(next.id)}>Bài tiếp theo →</Link> : <span>Đã đến bài cuối</span>}</nav>
        {complete.isError && <p role="alert" className="learning-error">Không lưu được tiến độ. Vui lòng kiểm tra quyền học hoặc thử lại.</p>}
        <section className="learning-overview"><h2>Tổng quan bài học</h2>{lesson.content ? <SafePostContent content={lesson.content} /> : <p>Chưa có nội dung bổ sung.</p>}</section>
        {data.quizzes?.some(quiz=>quiz.lessonId===lesson.id||quiz.lessonId===null) && <section className="lesson-quizzes"><h2>Bài kiểm tra</h2>{data.quizzes.filter(quiz=>quiz.lessonId===lesson.id||quiz.lessonId===null).map(quiz=><div className="lesson-quiz-link" key={quiz.id}><div><b>{quiz.title}</b><small>{quiz.lessonId===null?'Bài kiểm tra toàn khóa':'Bài kiểm tra của bài học'} · {quiz.questionCount} câu · {quiz.durationMinutes} phút · Đạt {quiz.passRate}%</small></div><Link to={`/student/quizzes/${quiz.id}`}>Mở bài kiểm tra →</Link></div>)}</section>}
      </> : <p>Khóa học chưa có bài học đang hoạt động.</p>}</section>
    </div>
  </main>
}
