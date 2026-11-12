import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../../shared/services/apiClient'
import { CourseDialog } from '../../expert/screens/CourseUi'
import { courseError } from '../../expert/screens/ExpertCoursesPage'
import '../../expert/screens/courses.css'
import '../../expert/screens/course-studio.css'
import './course-deletion.css'

interface DeletionRequest {
 id: number; title: string; description: string; category: string; expertName: string; expertEmail: string;
 requestStatus: string; reason: string; requestedAt: string; reviewReason: string | null;
 reviewedAt: string | null; reviewedBy: string | null; registrations: number; lessons: number; questions: number
}
interface RequestPage { content: DeletionRequest[]; totalPages: number; totalElements: number }
const labels: Record<string, string> = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt xóa', REJECTED: 'Đã từ chối' }
const date = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '—'

export function CourseDeletionRequestsPage() {
 const endpoint = '/manager/course-deletion-requests'
 const [status, setStatus] = useState('PENDING')
 const [page, setPage] = useState(0)
 const [selected, setSelected] = useState<DeletionRequest | null>(null)
 const [reason, setReason] = useState('')
 const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
 const [message, setMessage] = useState('')
 const client = useQueryClient()
 const query = useQuery({ queryKey: ['course-deletion-requests', status, page], queryFn: async () =>
  (await apiClient.get<RequestPage>(endpoint, { params: { status, page, size: 10 } })).data })
 const review = useMutation({ mutationFn: async ({ request, approve, note }: { request: DeletionRequest; approve: boolean; note: string }) =>
  apiClient.post(`${endpoint}/${request.id}/review`, { approve, reason: note.trim(), expectedRequestedAt: request.requestedAt }),
  onSuccess: async (_, input) => {
   setSelected(null); setMessage(input.approve ? 'Đã duyệt xóa khóa học. Lịch sử liên quan được giữ lại.' : 'Đã từ chối yêu cầu xóa và gửi phản hồi cho Expert.')
   await Promise.all(['course-deletion-requests', 'expert-courses', 'expert-course', 'manager-courses', 'moderation-courses', 'published-courses', 'notifications'].map(key => client.invalidateQueries({ queryKey: [key] })))
  } })
 function open(row: DeletionRequest) { review.reset(); setSelected(row); setReason(''); setDecision(null) }
 return <main className="expert-courses deletion-management">
  <h1>Yêu cầu xóa khóa học</h1><p>Xem lý do của Expert và quyết định việc gỡ khóa học đã xuất bản.</p>
  {message && <p role="status" className="course-success">{message}</p>}
  <label>Lọc trạng thái <select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}>
   <option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt xóa</option><option value="REJECTED">Đã từ chối</option><option value="">Tất cả trạng thái</option>
  </select></label>
  {query.isPending ? <p role="status">Đang tải yêu cầu…</p> : query.isError ? <p role="alert" className="course-error">{courseError(query.error)} <button onClick={() => void query.refetch()}>Thử lại</button></p> : <>
   <p>{query.data.totalElements} yêu cầu</p><div className="course-table-wrap"><table className="course-table"><thead><tr><th>Khóa học</th><th>Expert</th><th>Lý do xóa</th><th>Ngày gửi</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>{query.data.content.map(row => <tr key={row.id}><td><strong>{row.title}</strong><div>{row.category}</div></td><td>{row.expertName}<div>{row.expertEmail}</div></td><td className="deletion-reason-cell">{row.reason}</td><td>{date(row.requestedAt)}</td><td>{labels[row.requestStatus] || row.requestStatus}</td><td><button onClick={() => open(row)}>{row.requestStatus === 'PENDING' ? 'Xem và xét duyệt' : 'Chi tiết'}</button></td></tr>)}</tbody>
   </table>{!query.data.content.length && <p>Không có yêu cầu phù hợp.</p>}</div>
   <nav className="course-pagination" aria-label="Phân trang yêu cầu"><span>Trang {page + 1} / {Math.max(1, query.data.totalPages)}</span><button disabled={page === 0 || query.isFetching} onClick={() => setPage(p => p - 1)}>Trước</button><button disabled={page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setPage(p => p + 1)}>Sau</button></nav>
  </>}
  {selected && <CourseDialog title="Xét duyệt yêu cầu xóa" onClose={() => { if (!review.isPending) setSelected(null) }}>
   <h3>{selected.title}</h3><p>{selected.expertName} · {selected.expertEmail}</p><p>{selected.description}</p>
   <p>{selected.lessons} bài học · {selected.questions} câu hỏi · {selected.registrations} lượt đăng ký</p>
   <div className="deletion-request-reason"><strong>Lý do Expert yêu cầu xóa</strong><p>{selected.reason}</p><small>Gửi lúc {date(selected.requestedAt)}</small></div>
   {selected.requestStatus === 'PENDING' ? <>
    <p>Duyệt xóa sẽ gỡ khóa học và ngừng quyền truy cập nội dung. Dữ liệu đăng ký, thanh toán và học tập vẫn được lưu giữ.</p>
    <label className="deletion-reason">Phản hồi của Manager (bắt buộc khi từ chối)<textarea rows={3} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} disabled={review.isPending} /></label>
    {review.isError && <p className="course-error" role="alert">{courseError(review.error)}</p>}
    {decision && <p role="status">{decision === 'approve' ? 'Bạn xác nhận duyệt xóa khóa học này?' : 'Bạn xác nhận từ chối yêu cầu xóa này?'}</p>}
    <div className="studio-dialog-actions">
     <button disabled={review.isPending} onClick={() => setSelected(null)}>Đóng</button>
     {!decision ? <><button disabled={review.isPending || !reason.trim()} onClick={() => setDecision('reject')}>Từ chối yêu cầu</button><button className="course-danger" onClick={() => setDecision('approve')}>Duyệt xóa</button></> : <><button disabled={review.isPending} onClick={() => setDecision(null)}>Quay lại</button><button className="course-danger" disabled={review.isPending || (decision === 'reject' && !reason.trim())} onClick={() => review.mutate({ request: selected, approve: decision === 'approve', note: reason })}>{review.isPending ? 'Đang xử lý…' : 'Xác nhận'}</button></>}
    </div>
   </> : <><p><strong>{labels[selected.requestStatus]}</strong> · {selected.reviewedBy} · {date(selected.reviewedAt)}</p><p className="deletion-request-reason">{selected.reviewReason}</p><div className="studio-dialog-actions"><button onClick={() => setSelected(null)}>Đóng</button></div></>}
  </CourseDialog>}
 </main>
}
