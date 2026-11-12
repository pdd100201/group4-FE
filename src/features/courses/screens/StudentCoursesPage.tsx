import { useQueries } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useStudentCourses } from '../../../shared/hooks/useStudentCourses'
import { useAuth } from '../../../shared/context/AuthContext'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import { learningApi } from '../../learning/api/learningApi'
import './student-courses.css'

export function StudentCoursesPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [tab, setTab] = useState<'learning' | 'completed' | 'all'>('all')
  const query = useStudentCourses(page, search, sort)
  const courses = query.data?.content ?? []
  const progress = useQueries({ queries: courses.map(course => ({ queryKey: ['student-learning', user?.id, course.courseId, null], queryFn: () => learningApi.read(course.courseId, null), enabled: course.available, staleTime: 60_000, retry: false })) })
  const entries = courses.map((course, index) => ({ course, summary: progress[index]?.data, loading: course.available && progress[index]?.isPending }))
  const completed = entries.filter(item => item.summary?.progressPercent === 100).length
  const learning = entries.filter(item => item.summary && item.summary.progressPercent < 100).length
  const progressPending = entries.some(item => item.loading)
  const visible = entries.filter(item => tab === 'all' || (tab === 'completed' ? item.summary?.progressPercent === 100 : item.summary && item.summary.progressPercent < 100))
  function apply(event: FormEvent) { event.preventDefault(); setPage(0); setSearch(draft.trim()) }
  return <section className="student-courses-page">
    <header className="student-courses-welcome"><div><h1>Khóa học của tôi</h1><p>Chào mừng trở lại{user?.fullName ? `, ${user.fullName}` : ''}! Tiếp tục hành trình học tập của bạn.</p><small>Mỗi bài học là một bước tiến mới.</small></div>
      <dl className="student-course-stats"><div><dd>{query.data?.totalElements ?? '—'}</dd><dt>Khóa có hiệu lực</dt></div><div><dd>{progressPending ? '…' : completed}</dd><dt>Hoàn thành · trang này</dt></div><div><dd>{progressPending ? '…' : learning}</dd><dt>Đang học · trang này</dt></div></dl>
    </header>
    <div className="student-courses-toolbar"><div className="student-course-tabs" role="group" aria-label="Lọc khóa học trên trang hiện tại">{([['learning', 'Đang học', learning], ['completed', 'Đã hoàn thành', completed], ['all', 'Tất cả khóa học', courses.length]] as const).map(([value, label, count]) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}>{label} ({progressPending && value !== 'all' ? '…' : count})</button>)}</div>
      <form className="student-courses-filters" onSubmit={apply}><label className="student-course-search"><span aria-hidden="true">⌕</span><input aria-label="Tìm khóa học của bạn" type="search" maxLength={200} placeholder="Tìm khóa học của bạn..." value={draft} onChange={event => setDraft(event.target.value)} /></label><button type="submit" className="student-course-search-button" aria-label="Tìm kiếm">Tìm</button><select aria-label="Sắp xếp khóa học" value={sort} onChange={event => { setSort(event.target.value); setPage(0) }}><option value="newest">Mới kích hoạt ▾</option><option value="title">Tên khóa học</option></select></form>
    </div>
    {query.isPending ? <p className="student-course-state" role="status">Đang tải khóa học…</p> : query.isError ? <div className="student-course-state" role="alert">{courseError(query.error)} <button onClick={() => void query.refetch()}>Thử lại</button></div> : <>
      {visible.length === 0 ? <div className="student-courses-empty"><span aria-hidden="true">▤</span><h2>{progressPending ? 'Đang tải tiến độ học tập…' : tab !== 'all' ? 'Chưa có khóa học trong mục này' : search ? 'Không tìm thấy khóa học' : 'Hành trình học tập bắt đầu từ đây'}</h2><p>{tab !== 'all' ? 'Bộ lọc tiến độ áp dụng cho các khóa học trên trang hiện tại.' : 'Khám phá khóa học hoặc kiểm tra đăng ký của bạn.'}</p><Link to={tab !== 'all' || search ? '/student/courses' : '/courses'} onClick={() => { setTab('all'); setDraft(''); setSearch(''); setPage(0) }}>{tab !== 'all' || search ? 'Xem tất cả khóa học' : 'Khám phá khóa học →'}</Link></div> : <div className="student-courses-grid">{visible.map(({ course, summary, loading }) => {
        const done = summary?.progressPercent === 100
        const lesson = summary?.currentLesson
        return <article className={`student-course-card course-tone-${course.courseId % 4} ${done ? 'is-finished' : ''}`} key={course.courseId}>
          <div className="student-course-cover"><span className="student-course-status">{!course.available ? 'TẠM NGỪNG' : done ? '✓ HOÀN THÀNH' : 'ĐANG HỌC'}</span>{course.thumbnailUrl ? <img src={course.thumbnailUrl} alt={`Ảnh khóa học ${course.title}`} loading="lazy" /> : <div><b>{course.title}</b><small>{course.category ?? 'EduLearn'}</small></div>}</div>
          <div className="student-course-content"><small className="student-course-category">{course.category ?? 'KHÓA HỌC'}</small><h2>{course.title}</h2><p className="student-course-expert">Giảng viên: <b>{course.expertName}</b></p>
            <div className={`student-course-resume ${done ? 'finished' : ''}`}><small>{done ? 'Trạng thái khóa học' : 'Bài học đang học:'}</small><b>{!course.available ? 'Khóa học đang tạm ngừng hiển thị.' : loading ? 'Đang tải nội dung...' : done ? 'Bạn đã hoàn thành khóa học!' : summary && summary.completedLessons === summary.lessons.length && summary.quizzes.some(quiz => !quiz.passed) ? 'Đã học xong bài học. Hãy hoàn thành câu hỏi để kết thúc khóa học.' : lesson?.title ?? 'Sẵn sàng bắt đầu học'}</b></div>
            <div className="student-course-progress-label"><b>Tiến độ khóa học:</b><strong>{summary ? `${summary.progressPercent}%` : '—'}</strong></div>
            <progress max={100} value={summary?.progressPercent ?? 0} aria-label={`Tiến độ ${course.title}`} />
            <div className="student-course-progress-meta"><span>{summary ? `${summary.completedLessons}/${summary.lessons.length} bài học · ${summary.quizzes.filter(quiz => quiz.passed).length}/${summary.quizzes.length} phần câu hỏi đạt` : loading ? 'Đang tải tiến độ…' : 'Tiến độ chưa khả dụng'}</span><span>{course.lifetime ? 'Vĩnh viễn' : course.validUntil ? `Đến ${new Date(course.validUntil).toLocaleDateString('vi-VN')}` : course.packageName}</span></div>
            <div className="student-course-actions">{course.available ? <Link className="student-course-continue" to={`/student/courses/${course.courseId}/${lesson ? `lessons/${lesson.id}` : 'learn'}`}>{done ? 'Ôn tập lại ↻' : 'Tiếp tục học ngay →'}</Link> : <Link className="student-course-continue" to={`/student/registrations/${course.registrationId}`}>Xem đăng ký</Link>}{course.available && <Link className="student-course-discussions" to={`/student/courses/${course.courseId}/${lesson ? `lessons/${lesson.id}` : 'learn'}?tab=discussions`}>Hỏi đáp bài học</Link>}<Link className="student-course-curriculum" to={`/courses/${course.courseId}`}>Giáo trình</Link></div>
          </div>
        </article>
      })}</div>}
      <nav className="student-courses-pagination" aria-label="Phân trang khóa học"><button type="button" aria-label="Trang trước" disabled={page === 0 || query.isFetching} onClick={() => setPage(value => value - 1)}>‹</button>{Array.from({ length: Math.min(5, query.data.totalPages) }, (_, index) => Math.min(Math.max(0, page - 2), Math.max(0, query.data.totalPages - 5)) + index).map(value => <button type="button" key={value} aria-current={page === value ? 'page' : undefined} disabled={query.isFetching} onClick={() => setPage(value)}>{value + 1}</button>)}<button type="button" aria-label="Trang sau" disabled={page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setPage(value => value + 1)}>›</button></nav>
    </>}
  </section>
}
