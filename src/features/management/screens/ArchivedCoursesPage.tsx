import { useState, type FormEvent } from 'react'
import { useCourseModeration, useModerationCourses } from '../../../shared/hooks/useCourseModeration'
import type { Moderator, ModerationAction } from '../api/courseModerationApi'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import '../../expert/screens/courses.css'

const labels: Record<ModerationAction, string> = { archive: 'Ẩn khóa học', restore: 'Khôi phục khóa học', delete: 'Xóa hẳn khóa học' }
export function ArchivedCoursesPage({ role }: { role: Moderator }) {
  const [status, setStatus] = useState<'PUBLISHED' | 'ARCHIVED'>('ARCHIVED')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<{ id: number; title: string; action: ModerationAction } | null>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const query = useModerationCourses(role, status, page)
  const mutation = useCourseModeration()
  function open(id: number, title: string, action: ModerationAction) {
    mutation.reset(); setReason(''); setSelected({ id, title, action })
  }
  async function confirm(event: FormEvent) {
    event.preventDefault()
    if (!selected || !reason.trim() || mutation.isPending) return
    try {
      await mutation.mutateAsync({ role, id: selected.id, action: selected.action, reason: reason.trim() })
      setMessage(labels[selected.action] + ' thành công.'); setSelected(null); setReason('')
      if (query.data?.content.length === 1 && page > 0) setPage(p => p - 1)
    } catch { /* Keep the reason and display the server error. */ }
  }
  return <section className="expert-courses">
    <header className="course-heading"><div><h1>Quản lý trạng thái khóa học</h1><p>Ẩn, khôi phục hoặc xóa khóa học với lý do được lưu trong lịch sử.</p></div></header>
    <div className="course-filters"><label>Trạng thái<select value={status} onChange={event => { setStatus(event.target.value as 'PUBLISHED' | 'ARCHIVED'); setPage(0); setMessage('') }}><option value="ARCHIVED">Đã ẩn / lưu trữ</option><option value="PUBLISHED">Đã xuất bản</option></select></label></div>
    {message && <p role="status" className="course-success">{message}</p>}
    {query.isPending ? <p role="status">Đang tải…</p> : query.isError ? <div role="alert"><p>{courseError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div> : <>
      <div className="course-table-wrap"><table className="course-table"><thead><tr><th>Khóa học</th><th>Expert</th><th>Danh mục</th><th>Thao tác</th></tr></thead><tbody>
        {query.data.content.map(course => <tr key={course.id}><td>{course.title}<small>#{course.id}</small></td><td>{course.expertName}</td><td>{course.category}</td><td><div className="course-row-actions"><button onClick={() => open(course.id, course.title, status === 'ARCHIVED' ? 'restore' : 'archive')}>{status === 'ARCHIVED' ? 'Khôi phục' : 'Ẩn'}</button><button className="course-danger" onClick={() => open(course.id, course.title, 'delete')}>Xóa hẳn</button></div></td></tr>)}
      </tbody></table></div>
      {!query.data.content.length && <p>Không có khóa học phù hợp.</p>}
      <div className="course-pagination"><span>{query.data.totalElements} khóa học · Trang {page + 1}/{Math.max(1, query.data.totalPages)}</span><button disabled={page === 0 || query.isFetching} onClick={() => setPage(p => p - 1)}>Trước</button><button disabled={page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setPage(p => p + 1)}>Sau</button></div>
    </>}
    {selected && <div className="course-modal-backdrop"><form className="course-modal" role="dialog" aria-modal="true" aria-labelledby="moderation-title" onSubmit={event => void confirm(event)}>
      <h2 id="moderation-title">{labels[selected.action]}</h2><p>Khóa học: “{selected.title}”</p>
      <p>{selected.action === 'restore' ? 'Khóa học sẽ được xuất bản trở lại và hiển thị công khai.' : selected.action === 'archive' ? 'Khóa học sẽ không còn hiển thị trong danh mục công khai. Dữ liệu và lịch sử được giữ nguyên.' : 'Thao tác không thể hoàn tác: xóa cả nội dung bài học và quiz nếu không có dữ liệu cần lưu giữ. Nếu có đăng ký hoặc lịch sử học tập, hệ thống sẽ chặn xóa; hãy chọn Ẩn.'}</p>
      <label>Lý do *<textarea autoFocus required maxLength={255} rows={5} value={reason} disabled={mutation.isPending} onChange={event => setReason(event.target.value)} /></label>
      {mutation.isError && <p role="alert" className="course-error">{courseError(mutation.error)}</p>}
      <div className="course-row-actions"><button type="button" disabled={mutation.isPending} onClick={() => { setSelected(null); setReason('') }}>Hủy</button><button className={selected.action === 'delete' ? 'course-danger' : 'course-primary'} type="submit" disabled={mutation.isPending || !reason.trim()}>{mutation.isPending ? 'Đang xử lý…' : 'Xác nhận'}</button></div>
    </form></div>}
  </section>
}
