import { useState } from 'react'
import { useCourseActions, useSubmissionReadiness } from '../../../shared/hooks/useExpertCourses'
import type { ExpertCourse } from '../api/expertCourseApi'
import { courseError } from './ExpertCoursesPage'

export function CourseSubmissionPanel({ course, dirty, busy, onBusy }: { course?: ExpertCourse; dirty: boolean; busy: boolean; onBusy: (value: boolean) => void }) {
  const query = useSubmissionReadiness(course?.id)
  const { submit } = useCourseActions()
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState('')
  const eligible = course?.status === 'DRAFT' || course?.status === 'REJECTED'
  const label = course?.status === 'REJECTED' ? 'Gửi lại duyệt' : 'Gửi duyệt'
  const disabled = busy || dirty || !query.data?.ready || query.isFetching || submit.isPending
  async function confirm() {
    if (!course || disabled || !eligible) return
    onBusy(true)
    try {
      await submit.mutateAsync(course)
      setConfirming(false); setMessage('Đã gửi khóa học. Trạng thái hiện tại: Chờ duyệt. Manager sẽ xem xét và quyết định xuất bản.')
    } catch { /* Display the server error without closing the dialog. */ }
    finally { onBusy(false) }
  }
  return <aside className="course-panel"><h2>Gửi khóa học xét duyệt</h2>
    {message && <p role="status" className="course-success">{message}</p>}
    {!course ? <p>Lưu bản nháp trước, sau đó thêm ảnh, bài học/video và quiz để gửi duyệt.</p> : <>
      {eligible ? <>
        <p>Hoàn tất các mục sau để chuyển khóa học sang Chờ duyệt. Không yêu cầu tối thiểu 5 bài học.</p>
        {query.isPending ? <p role="status">Đang kiểm tra điều kiện…</p> : query.isError ? <p role="alert" className="course-error">{courseError(query.error)}</p> : <ul>{query.data?.checks.map(check => <li key={check.code}>{check.complete ? '✓ Đã đủ' : '○ Còn thiếu'} — {check.label}</li>)}</ul>}
        <p>Gói giá riêng chưa được triển khai; hiện kiểm tra giá khóa học đã lưu.</p>
        {course.status === 'REJECTED' && <p>Hãy sửa các nội dung Manager yêu cầu trước khi gửi lại.</p>}
        {dirty && <p role="status">Bạn có thay đổi chưa lưu. Hãy bấm Lưu thay đổi trước khi gửi duyệt.</p>}
        <div className="course-row-actions"><button className="course-primary" disabled={disabled} onClick={() => { submit.reset(); setConfirming(true) }}>{label}</button><button disabled={busy || query.isFetching} onClick={() => void query.refetch()}>Kiểm tra lại</button></div>
      </> : <p>{course.status === 'PENDING_REVIEW' ? 'Khóa học đang chờ Manager duyệt. Nội dung bị khóa trong thời gian xét duyệt.' : course.status === 'PUBLISHED' ? 'Khóa học đã xuất bản. Lưu thay đổi thông tin/ảnh sẽ cập nhật công khai ngay, không gửi duyệt lại.' : 'Trạng thái hiện tại không cho phép gửi duyệt.'}</p>}
    </>}
    {confirming && <div className="course-modal-backdrop"><section className="course-modal" role="dialog" aria-modal="true" aria-labelledby="submit-course-title"><h2 id="submit-course-title">{label} khóa học?</h2><p>“{course?.title}” sẽ chuyển sang Chờ duyệt và khóa chỉnh sửa cho đến khi Manager xét duyệt. Khóa học chưa được xuất bản ngay.</p>{submit.isError && <p role="alert" className="course-error">{courseError(submit.error)}</p>}<div className="course-row-actions"><button autoFocus disabled={submit.isPending} onClick={() => setConfirming(false)}>Hủy</button><button className="course-primary" disabled={disabled} onClick={() => void confirm()}>{submit.isPending ? 'Đang gửi…' : 'Xác nhận gửi duyệt'}</button></div></section></div>}
  </aside>
}
