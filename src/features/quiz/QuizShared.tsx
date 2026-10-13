import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuizCourses } from '../../shared/hooks/useQuizManagement'
import { quizError } from './api/quizService'
import type { CourseStatus } from '../../shared/types/entities'
import './quiz.css'

const labels: Record<CourseStatus, string> = { DRAFT: 'Nháp', REJECTED: 'Bị từ chối', PENDING_REVIEW: 'Chờ duyệt', PUBLISHED: 'Đã xuất bản', ARCHIVED: 'Đã ẩn', APPROVED: 'Đã duyệt (cũ)' }
export const courseStatusLabel = (status: CourseStatus) => labels[status]
export const canManageQuiz = (status: CourseStatus) => status === 'DRAFT' || status === 'REJECTED'
export function QuizError({ error, retry }: { error: unknown; retry?: () => void }) {
  return <div className="qm-feedback qm-error" role="alert"><p>{quizError(error)}</p>{retry && <button type="button" onClick={retry}>Thử lại</button>}</div>
}
export function QuizCoursePicker({ role }: { role: 'expert' | 'manager' }) {
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [page, setPage] = useState(0)
  const query = useQuizCourses(role, search, page)
  return <section className="qm-panel">
    <h2>{role === 'expert' ? 'Chọn khóa học của bạn' : 'Khóa học đang chờ duyệt'}</h2>
    <form className="qm-search" onSubmit={e => { e.preventDefault(); setSearch(draft.trim()); setPage(0) }}>
      <label className="qm-grow">Tên khóa học<input value={draft} maxLength={200} onChange={e => setDraft(e.target.value)} placeholder="Tìm khóa học..." /></label><button type="submit">Tìm kiếm</button>
    </form>
    {query.isPending && <p role="status">Đang tải khóa học...</p>}
    {query.isError && <QuizError error={query.error} retry={() => { void query.refetch() }} />}
    {query.data && <>
      {query.data.content.length === 0 ? <p className="qm-empty">{search ? 'Không có khóa học phù hợp.' : role === 'expert' ? 'Bạn chưa có khóa học để quản lý quiz.' : 'Không có khóa học đang chờ duyệt.'}</p> :
        <div className="qm-table-scroll"><table className="qm-table"><thead><tr><th>Khóa học</th><th>Danh mục</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{query.data.content.map(c =>
          <tr key={c.id}><td><strong>{c.title}</strong><small>#{c.id}</small></td><td>{c.category}</td><td>{courseStatusLabel(c.status)}</td><td><Link to={role === 'expert' ? `/expert/courses/${c.id}/quizzes` : `/manager/courses/${c.id}/review/quizzes`}>{role === 'expert' ? 'Quản lý quiz' : 'Xem trước quiz'} →</Link></td></tr>)}</tbody></table></div>}
      <nav className="qm-pagination" aria-label="Phân trang khóa học"><span>{query.data.totalElements} khóa học</span><button disabled={page === 0 || query.isFetching} onClick={() => setPage(p => p - 1)}>Trước</button><span>Trang {page + 1} / {Math.max(1, query.data.totalPages)}</span><button disabled={page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setPage(p => p + 1)}>Sau</button></nav>
    </>}
  </section>
}
