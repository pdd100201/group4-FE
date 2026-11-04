import { useState, useRef, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../../shared/services/apiClient'
import { useAuth } from '../../../shared/context/AuthContext'
import { notificationError } from './NotificationCenter'
type Announcement = { id: number; title: string; message: string; recipientCount: number; createdAt: string }
export function CourseAnnouncements({ courseId, published }: { courseId: number; published: boolean }) {
 const { user } = useAuth()
 const client = useQueryClient()
 const [page, setPage] = useState(0)
 const [title, setTitle] = useState('')
 const [message, setMessage] = useState('')
 const [receipt, setReceipt] = useState<string | null>(null)
 const request = useRef<{ signature: string; key: string } | null>(null)
 const base = `/expert/courses/${courseId}/announcements`
 const history = useQuery({ queryKey: ['course-announcements', user?.id, courseId, page],
  queryFn: async () => (await apiClient.get<{ content: Announcement[]; totalPages: number }>(base, { params: { page } })).data, retry: false })
 const send = useMutation({
  mutationFn: async () => {
   const body = { title: title.trim(), message: message.trim() }
   const signature = JSON.stringify(body)
   if (request.current?.signature !== signature) request.current = { signature, key: crypto.randomUUID() }
   return (await apiClient.post<Announcement>(base, { ...body, requestKey: request.current.key })).data
  },
  onSuccess: async result => {
   setReceipt(`Đã gửi thông báo đến ${result.recipientCount} học viên có quyền học hiện tại.`)
   setTitle(''); setMessage(''); setPage(0); request.current = null
   await client.invalidateQueries({ queryKey: ['course-announcements', user?.id, courseId] })
  },
 })
 function submit(event: FormEvent) {
  event.preventDefault()
  if (!published || send.isPending || !title.trim() || !message.trim()) return
  setReceipt(null); send.mutate()
 }
 return <section className="course-panel">
  <h2>Thông báo cho học viên</h2><p>Gửi cập nhật, hướng dẫn học hoặc lịch hỗ trợ tới học viên đang có quyền học khóa này.</p>
  {published ? <form className="announcement-form" onSubmit={submit}>
   <label>Tiêu đề<input required maxLength={200} value={title} disabled={send.isPending} onChange={e => setTitle(e.target.value)} /></label>
   <label>Nội dung<textarea required maxLength={1000} rows={4} value={message} disabled={send.isPending} onChange={e => setMessage(e.target.value)} /></label>
   <button className="course-primary" disabled={send.isPending || !title.trim() || !message.trim()}>{send.isPending ? 'Đang gửi...' : 'Gửi thông báo cho học viên'}</button>
  </form> : <p>Chỉ gửi thông báo khi khóa học đã được xuất bản.</p>}
  {receipt && <p role="status">{receipt}</p>}{send.isError && <p role="alert">{notificationError(send.error)}</p>}
  <h3>Lịch sử đã gửi</h3>
  {history.isPending && <p role="status">Đang tải lịch sử...</p>}
  {history.isError && <div role="alert"><p>{notificationError(history.error)}</p><button onClick={() => void history.refetch()}>Thử lại</button></div>}
  {history.isSuccess && <>{history.data.content.map(a => <article className="announcement-history" key={a.id}><strong>{a.title}</strong><p>{a.message}</p><small>{a.recipientCount} học viên · {new Date(a.createdAt).toLocaleString('vi-VN')}</small></article>)}
   {!history.data.content.length && <p>Chưa gửi thông báo nào.</p>}
   {history.data.totalPages > 1 && <nav className="notification-pagination" aria-label="Trang lịch sử thông báo"><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</button><span>Trang {page + 1}/{history.data.totalPages}</span><button disabled={page + 1 >= history.data.totalPages} onClick={() => setPage(p => p + 1)}>Sau</button></nav>}
  </>}
 </section>
}
