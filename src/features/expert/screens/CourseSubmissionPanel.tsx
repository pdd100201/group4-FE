import { useState } from 'react'
import { useCourseActions, useSubmissionReadiness } from '../../../shared/hooks/useExpertCourses'
import type { ExpertCourse } from '../api/expertCourseApi'
import { courseError } from './ExpertCoursesPage'
import { CourseDialog, CourseIcon } from './CourseUi'

const checklist: Record<string, { title: string; description: string; step: string }> = {
 BASIC: { title: 'Thông tin giới thiệu', description: 'Tên, danh mục và mô tả giúp học viên hiểu khóa học.', step: 'info' },
 THUMBNAIL: { title: 'Ảnh bìa khóa học', description: 'Hình ảnh đại diện cho khóa học trên trang khám phá.', step: 'info' },
 PRICE: { title: 'Thông tin giá hợp lệ', description: 'Giá khóa học đáp ứng điều kiện của hệ thống.', step: 'pricing' },
 PACKAGES: { title: 'Gói học đang mở', description: 'Có ít nhất một gói để học viên đăng ký.', step: 'pricing' },
 LESSONS: { title: 'Bài học & video', description: 'Bài học có nội dung, thứ tự và video giảng dạy đầy đủ.', step: 'content' },
 QUIZZES: { title: 'Quiz đánh giá', description: 'Cấu hình thời gian làm bài, điểm đạt và số lượt.', step: 'content' },
}
export function CourseSubmissionPanel({ course, dirty, busy, onBusy, onFix }: { course?: ExpertCourse; dirty: boolean; busy: boolean; onBusy: (value: boolean) => void; onFix?: (step: string) => void }) {
 const query = useSubmissionReadiness(course?.id)
 const { submit } = useCourseActions()
 const [confirming, setConfirming] = useState(false)
 const [message, setMessage] = useState('')
 const eligible = course?.status === 'DRAFT' || course?.status === 'REJECTED'
 const disabled = busy || dirty || !query.data?.ready || query.isFetching || submit.isPending
 async function confirm() {
  if (!course || disabled || !eligible) return
  onBusy(true)
  try { await submit.mutateAsync(course); setConfirming(false); setMessage('Đã gửi khóa học đến Manager. Bạn có thể theo dõi trạng thái tại danh sách khóa học.') }
  catch { /* Keep confirmation open and preserve the server error. */ }
  finally { onBusy(false) }
 }
 return <aside className="course-panel studio-review-panel"><div className="studio-panel-heading"><h3>Kiểm tra trước khi gửi</h3><button type="button" disabled={busy || query.isFetching} onClick={() => void query.refetch()}>↻ Kiểm tra lại</button></div>
  {message && <p role="status" className="course-success">{message}</p>}
  {!course ? <p>Lưu bản nháp để bắt đầu chuẩn bị khóa học.</p> : <>
   {query.isPending ? <p role="status">Đang kiểm tra điều kiện…</p> : query.isError ? <p role="alert" className="course-error">{courseError(query.error)}</p> : <ul className="studio-checklist">{query.data?.checks.map(check => {
    const item = checklist[check.code]
    return <li key={check.code}><span className={`studio-check-indicator ${check.complete ? 'is-complete' : ''}`}>{check.complete ? <CourseIcon name="check" /> : '!'}</span><div><b>{item?.title ?? check.label}</b><p>{item?.description ?? check.label}</p><small>{check.complete ? 'Đã hoàn tất' : 'Cần bổ sung'}</small></div>{!check.complete && onFix && item && <button onClick={() => onFix(item.step)} disabled={busy}>Bổ sung <CourseIcon name="next" /></button>}</li>
   })}</ul>}
   <div className="studio-send-box"><div className="studio-send-icon"><CourseIcon name="spark" /></div><div><h3>{eligible ? query.data?.ready && !dirty ? 'Khóa học đã sẵn sàng!' : 'Chỉ còn vài bước để sẵn sàng' : course.status === 'PENDING_REVIEW' ? 'Khóa học đang được xét duyệt' : course.status === 'PUBLISHED' ? 'Khóa học đã đến với học viên' : 'Trạng thái khóa học'}</h3><p>{eligible ? 'Manager sẽ kiểm tra nội dung và quyết định xuất bản. Trong thời gian chờ duyệt, nội dung khóa học sẽ được khóa chỉnh sửa.' : course.status === 'PENDING_REVIEW' ? 'Bạn sẽ nhận được thông báo khi Manager có kết quả xét duyệt.' : course.status === 'PUBLISHED' ? 'Thông tin và ảnh bìa được cập nhật công khai sau khi lưu. Giáo trình vẫn được bảo vệ theo quy trình quản lý nội dung.' : 'Khóa học hiện không thể gửi duyệt.'}</p>{dirty && eligible && <p className="studio-unsaved" role="status">Cần lưu thông tin hoặc các gói học đang thay đổi trước khi gửi duyệt.</p>}</div>{eligible && <button className="course-primary" disabled={disabled} onClick={() => { submit.reset(); setConfirming(true) }}>{course.status === 'REJECTED' ? 'Gửi lại xét duyệt' : 'Gửi duyệt khóa học'}<CourseIcon name="next" /></button>}</div>
  </>}
  {confirming && <CourseDialog title="Gửi khóa học xét duyệt?" onClose={() => { if (!submit.isPending) setConfirming(false) }}><p><b>{course?.title}</b> sẽ chuyển sang Chờ duyệt. Bạn có thể chỉnh sửa tiếp nếu Manager yêu cầu bổ sung.</p>{submit.isError && <p role="alert" className="course-error">{courseError(submit.error)}</p>}<div className="studio-dialog-actions"><button disabled={submit.isPending} onClick={() => setConfirming(false)}>Tiếp tục chỉnh sửa</button><button className="course-primary" disabled={disabled} onClick={() => void confirm()}>{submit.isPending ? 'Đang gửi…' : 'Xác nhận gửi duyệt'}</button></div></CourseDialog>}
 </aside>
}