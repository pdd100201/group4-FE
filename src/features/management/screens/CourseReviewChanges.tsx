import { useQuery } from '@tanstack/react-query'
import { managerCourseApi } from '../api/managerCourseApi'
import { MediaVideo } from '../../../shared/components/media/MediaVideo'
import './review-changes.css'

function Value({ value, type, side }: { value: string | null; type: string; side: string }) {
  if (value === null) return <span className="review-change-empty">Chưa có / Không có</span>
  if (type === 'image') return <a href={value} target="_blank" rel="noreferrer"><img className="review-change-image" src={value} alt={`Ảnh ${side}`} /></a>
  if (type === 'video') return <MediaVideo mediaId={Number(value)} />
  if (value.length > 300) return <details><summary>Xem toàn bộ nội dung</summary><p className="review-change-text">{value}</p></details>
  return <span className="review-change-text">{value || '(Để trống)'}</span>
}

export function CourseReviewChanges({ id }: { id: number }) {
  const query = useQuery({ queryKey: ['manager-course-changes', id], queryFn: () => managerCourseApi.changes(id) })
  return <section className="course-panel review-change-panel" aria-label="So sánh thay đổi khóa học">
    <h2>Expert đã thay đổi những gì?</h2>
    {query.isPending ? <p role="status">Đang tải so sánh…</p> : query.isError ? <p role="alert">Không tải được bản so sánh. <button onClick={() => void query.refetch()}>Thử lại</button></p> : !query.data.baselineAvailable ? <p>Chưa có bản lưu trước khi chỉnh sửa cho lần gửi này. Các lần sửa sau khi xuất bản sẽ được lưu để đối chiếu đầy đủ.</p> : <>
      <p>Đối chiếu với bản trước khi expert bắt đầu chỉnh sửa: <strong>{query.data.changes.length} mục thay đổi</strong>.</p>
      {query.data.changes.length === 0 ? <p>Không có khác biệt so với bản đã lưu.</p> : <div className="review-change-scroll"><table className="review-change-table">
        <thead><tr><th scope="col">Mục thay đổi</th><th scope="col">Trước khi sửa</th><th scope="col">Sau khi sửa</th></tr></thead>
        <tbody>{query.data.changes.map(change => <tr key={change.key}><th scope="row">{change.label}</th><td className="review-change-before"><Value type={change.type} value={change.before} side="trước khi sửa" /></td><td className="review-change-after"><Value type={change.type} value={change.after} side="sau khi sửa" /></td></tr>)}</tbody>
      </table></div>}
    </>}
  </section>
}
