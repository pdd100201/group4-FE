import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { validId, useQuizWorkspace, useQuizWrites } from '../../shared/hooks/useQuizManagement'
import type { ManagedQuiz } from '../../shared/types/quiz'
import { canManageQuiz, courseStatusLabel, QuizCoursePicker, QuizError } from './QuizShared'

export function ExpertQuizPage() {
  const { courseId: rawId } = useParams()
  const courseId = validId(rawId)
  return <div className="qm-page"><header className="qm-heading"><div><p className="qm-eyebrow">EDUPORTAL · GIẢNG DẠY</p><h1>Quản lý quiz</h1><p>Tạo và quản lý bài kiểm tra trong khóa học của bạn.</p></div></header>
    {rawId === undefined ? <QuizCoursePicker role="expert" /> : courseId === null ? <p role="alert">Mã khóa học không hợp lệ.</p> : <QuizWorkspace key={courseId} courseId={courseId} />}
  </div>
}
function QuizWorkspace({ courseId }: { courseId: number }) {
  const { course, quizzes, lessons } = useQuizWorkspace(courseId)
  const { remove } = useQuizWrites(courseId)
  const [params, setParams] = useSearchParams()
  const [deleting, setDeleting] = useState<ManagedQuiz | null>(null)
  const [message, setMessage] = useState('')
  const confirmation = useRef<HTMLElement>(null)
  useEffect(() => { if (deleting) confirmation.current?.scrollIntoView({ behavior: 'instant', block: 'center' }) }, [deleting])
  const search = params.get('q') ?? ''
  const active = params.get('active') ?? ''
  const requestedPage = validId(params.get('page')) ?? 1
  const filtered = (quizzes.data ?? []).filter(q => q.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (!active || String(q.active) === active))
  const pages = Math.max(1, Math.ceil(filtered.length / 10))
  const page = Math.min(requestedPage, pages)
  const updateFilter = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); next.delete('page'); setParams(next, { replace: true }) }
  const setPage = (value: number) => { const next = new URLSearchParams(params); next.set('page', String(value)); setParams(next) }
  const editable = course.data && canManageQuiz(course.data.status)
  async function confirmDelete() {
    if (!deleting) return
    try { await remove.mutateAsync(deleting.id); setDeleting(null); setMessage('Đã xóa quiz thành công.') } catch { /* Server error stays visible in the confirmation. */ }
  }
  return <>
    <Link to="/expert/quizzes">← Chọn khóa học khác</Link>
    {course.isPending && <p role="status">Đang tải khóa học...</p>}
    {course.isError && <QuizError error={course.error} retry={() => { void course.refetch() }} />}
    {course.data && <><section className="qm-panel qm-course-heading"><div><h2>{course.data.title}</h2><span>{courseStatusLabel(course.data.status)}</span></div>{editable && <Link className="primary-button qm-link-button" to={`/expert/courses/${courseId}/quizzes/new`}>+ Tạo quiz</Link>}</section>
      {!editable && <p className="qm-feedback">Chỉ được thay đổi quiz khi khóa học ở trạng thái Nháp hoặc Bị từ chối.</p>}
      {message && <p className="qm-feedback qm-success" role="status">{message}</p>}
      <section className="qm-panel"><div className="qm-filters"><label className="qm-grow">Tìm quiz<input value={search} maxLength={200} placeholder="Nhập tên quiz..." onChange={e => updateFilter('q', e.target.value)} /></label><label>Trạng thái<select value={active} onChange={e => updateFilter('active', e.target.value)}><option value="">Tất cả</option><option value="true">Hoạt động</option><option value="false">Không hoạt động</option></select></label></div>
        {quizzes.isPending && <p role="status">Đang tải danh sách quiz...</p>}
        {quizzes.isError && <QuizError error={quizzes.error} retry={() => { void quizzes.refetch() }} />}
        {quizzes.data && <>{filtered.length === 0 ? <p className="qm-empty">{quizzes.data.length ? 'Không có quiz phù hợp với bộ lọc.' : 'Khóa học chưa có quiz.'}</p> : <div className="qm-table-scroll"><table className="qm-table"><thead><tr><th>Quiz</th><th>Bài học</th><th>Câu hỏi</th><th>Thời lượng</th><th>Tỷ lệ đạt</th><th>Số lượt</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{filtered.slice((page - 1) * 10, page * 10).map(q => <tr key={q.id}>
          <td><strong>{q.title}</strong><small>#{q.id}</small></td><td>{q.lessonId === null ? 'Toàn khóa học' : lessons.data?.find(l => l.id === q.lessonId)?.title ?? `Bài học #${q.lessonId}`}</td><td>{q.questions.length}</td><td>{q.durationMinutes === null ? 'Chưa cấu hình' : `${q.durationMinutes} phút`}</td><td>{q.passRate === null ? '—' : `${q.passRate}%`}</td><td>{q.maxAttempts ?? '—'}</td><td><span className={`qm-badge ${q.active ? 'qm-active' : ''}`}>{q.active ? 'Hoạt động' : 'Không hoạt động'}</span></td><td><div className="qm-actions"><Link to={`/expert/courses/${courseId}/quizzes/${q.id}`}>Xem</Link>{editable && <><Link to={`/expert/courses/${courseId}/quizzes/${q.id}/edit`}>Sửa</Link><button className="qm-danger" onClick={() => { remove.reset(); setMessage(''); setDeleting(q) }}>Xóa</button></>}</div></td>
        </tr>)}</tbody></table></div>}
          <nav className="qm-pagination" aria-label="Phân trang quiz"><span>{filtered.length} quiz</span><button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button><span>Trang {page} / {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)}>Sau</button></nav></>}
      </section></>}
    {deleting && <section ref={confirmation} className="qm-panel qm-confirm" aria-labelledby="qm-delete-title"><h2 id="qm-delete-title">Xóa quiz “{deleting.title}”?</h2><p>Thao tác không thể hoàn tác. Quiz có lượt làm bài hoặc kết quả cần lưu giữ sẽ bị máy chủ từ chối xóa.</p>{remove.isError && <QuizError error={remove.error} />}<div className="qm-actions"><button disabled={remove.isPending} onClick={() => { setDeleting(null); remove.reset() }}>Hủy</button><button className="qm-danger" disabled={remove.isPending || !editable} onClick={() => { void confirmDelete() }}>{remove.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}</button></div></section>}
  </>
}
