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
  const [tab, setTab] = useState<'overview' | 'quizzes'>('overview')
  const valid = courseId !== null && (rawLesson === undefined || lessonId !== null)
  const key = ['student-learning', user?.id, courseId, lessonId]
  const query = useQuery({ queryKey: key, queryFn: () => learningApi.read(courseId!, lessonId), enabled: valid, retry: false })
  const complete = useMutation({ mutationFn: (id: number) => learningApi.complete(courseId!, id), onSuccess: async data => {
    client.setQueryData(key, data)
    await Promise.all([client.invalidateQueries({ queryKey: ['student-learning', user?.id, courseId] }), client.invalidateQueries({ queryKey: ['student-courses'] })])
  } })
  if (!valid) return <main className="learning-page learning-state"><p role="alert">Mã khóa học hoặc bài học không hợp lệ.</p><Link to="/student/courses">← Khóa học của tôi</Link></main>
  if (query.isPending) return <main className="learning-page learning-state"><p role="status">Đang tải bài học...</p></main>
  if (query.isError) return <main className="learning-page learning-state"><div role="alert"><h1>Không mở được bài học</h1><p>{isAxiosError(query.error) && query.error.response?.status === 403 ? 'Đăng ký chưa được kích hoạt hoặc quyền học đã hết hạn.' : isAxiosError(query.error) && query.error.response?.status === 404 ? 'Khóa học hoặc bài học không còn khả dụng.' : 'Không tải được nội dung. Vui lòng thử lại.'}</p><button onClick={() => void query.refetch()}>Thử lại</button> <Link to="/student/registrations">Đăng ký của tôi</Link></div></main>
  const data = query.data, lesson = data.currentLesson
  const index = data.lessons.findIndex(item => item.id === lesson?.id)
  const previous = data.lessons[index - 1], next = data.lessons[index + 1]
  const completed = data.lessons[index]?.completed
  const to = (id: number) => `/student/courses/${courseId}/lessons/${id}`
  const quizzes = data.quizzes?.filter(quiz => quiz.lessonId === lesson?.id || quiz.lessonId === null) ?? []
  const activeTab = quizzes.length > 0 ? tab : 'overview'
  const visibleLessons = data.lessons.filter(item => item.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  return <main className={`learning-page ${syllabus ? '' : 'learning-focus'}`}>
    <header className="learning-heading"><Link className="learning-back" to="/student/courses" aria-label="Quay lại khóa học của tôi">‹</Link>
      <div className="learning-course-identity"><h1>{data.courseTitle}</h1><p>Giảng viên: {data.expertName} · {lesson ? `Bài ${index + 1}: ${lesson.title}` : 'Nội dung khóa học'}</p></div>
      <div className="learning-progress"><div><b>Tiến độ khóa học:</b><span>{data.progressPercent}% ({data.completedLessons}/{data.lessons.length} bài)</span></div><progress value={data.progressPercent} max={100} aria-label="Tiến độ khóa học" /></div>
      <button className="learning-focus-button" aria-pressed={!syllabus} onClick={() => setSyllabus(value => !value)}>{syllabus ? '◉ Chế độ tập trung' : '☷ Hiện giáo trình'}</button>
      <Link to="/profile" className="student-avatar learning-avatar" aria-label="Hồ sơ của tôi">{user?.fullName?.[0] ?? 'H'}</Link>
    </header>
    <div className="learning-workspace">{syllabus && <aside className="learning-syllabus">
      <div className="learning-syllabus-title"><h2>Nội dung khóa học</h2><button onClick={() => setSyllabus(false)}>Thu gọn ▾</button></div>
      <label className="learning-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Tìm bài học" placeholder="Tìm kiếm bài học, quiz..." value={search} maxLength={200} onChange={event => setSearch(event.target.value)} /></label>
      <div className="learning-section-label"><span>Giáo trình khóa học</span><small>{data.completedLessons}/{data.lessons.length} bài</small></div>
      <nav aria-label="Bài học">{visibleLessons.map(item => <Link key={item.id} to={to(item.id)} aria-current={item.id === lesson?.id ? 'page' : undefined} className={item.completed ? 'is-completed' : ''}>
        <span className="learning-lesson-number" aria-hidden="true">{item.id === lesson?.id ? '▶' : item.completed ? '✓' : '○'}</span><span><b>Bài {data.lessons.indexOf(item) + 1}: {item.title}</b><small>{item.id === lesson?.id ? 'Đang học' : item.completed ? 'Đã hoàn thành' : 'Bài học'}{item.id === lesson?.id && completed ? ' · Hoàn thành' : ''}</small></span>
      </Link>)}{visibleLessons.length === 0 && <p className="learning-empty-search">Không có bài học phù hợp.</p>}
      {data.quizzes?.filter(quiz => quiz.title.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(quiz => <Link className="learning-syllabus-quiz" key={`quiz-${quiz.id}`} to={`/student/quizzes/${quiz.id}`}><span className="learning-lesson-number" aria-hidden="true">?</span><span><b>{quiz.title}</b><small>{quiz.questionCount} câu hỏi · {quiz.durationMinutes} phút · Đạt {quiz.passRate}%</small></span></Link>)}</nav>
    </aside>}
    <section className="learning-content">{lesson ? <>
      {lesson.videoMediaId !== null ? <MediaVideo key={lesson.videoMediaId} mediaId={lesson.videoMediaId} lessonPlayer /> : <div className="learning-no-video"><span aria-hidden="true">▷</span><h2>{lesson.title}</h2><p>Bài học này chưa có video. Bạn có thể đọc nội dung bên dưới.</p></div>}
      <nav className="learning-actions" aria-label="Điều hướng bài học">{previous ? <Link to={to(previous.id)}>← Bài trước</Link> : <button disabled>← Bài trước</button>}
        <button className={completed ? 'lesson-completed' : 'lesson-complete-action'} disabled={completed || complete.isPending} onClick={() => complete.mutate(lesson.id)}>{completed ? '✓ Đã học xong' : complete.isPending ? 'Đang lưu...' : '✓ Đánh dấu đã học'}</button>
        {quizzes[0] && <Link className="learning-quiz-action" to={`/student/quizzes/${quizzes[0].id}`}>Làm Quiz ▣</Link>}
        {next ? <Link className="learning-next-action" to={to(next.id)}>Bài tiếp theo →</Link> : <Link className="learning-next-action" to="/student/courses">Khóa học của tôi →</Link>}
      </nav>
      {complete.isError && <p role="alert" className="learning-error">Không lưu được tiến độ. Vui lòng kiểm tra quyền học hoặc thử lại.</p>}
      <div className="learning-tabs" role="tablist" aria-label="Nội dung bài học"><button id="lesson-overview-tab" role="tab" aria-selected={activeTab === 'overview'} aria-controls="lesson-tab-panel" onClick={() => setTab('overview')}>Tổng quan bài giảng</button>{quizzes.length > 0 && <button id="lesson-quizzes-tab" role="tab" aria-selected={activeTab === 'quizzes'} aria-controls="lesson-tab-panel" onClick={() => setTab('quizzes')}>Bài kiểm tra ({quizzes.length})</button>}</div>
      <section id="lesson-tab-panel" role="tabpanel" aria-labelledby={activeTab === 'overview' ? 'lesson-overview-tab' : 'lesson-quizzes-tab'} className="learning-overview">{activeTab === 'overview' ? <><h2>{lesson.title}</h2>{lesson.content ? <SafePostContent content={lesson.content} /> : <p>Chưa có nội dung bổ sung.</p>}</> : quizzes.map(quiz => <div className="lesson-quiz-link" key={quiz.id}><div><b>{quiz.title}</b><small>{quiz.questionCount} câu hỏi · {quiz.durationMinutes} phút · Đạt {quiz.passRate}%</small></div><Link to={`/student/quizzes/${quiz.id}`}>Làm bài →</Link></div>)}</section>
    </> : <p className="learning-empty-search">Khóa học chưa có bài học đang hoạt động.</p>}</section></div>
  </main>
}
