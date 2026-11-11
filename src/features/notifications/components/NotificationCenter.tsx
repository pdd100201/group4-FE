import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../../../shared/context/AuthContext'
import { notificationApi, notificationLabels, type NotificationItem } from '../api/notificationApi'
import './notifications.css'

export function notificationError(error: unknown) {
 return isAxiosError(error) && typeof error.response?.data?.message === 'string'
  ? error.response.data.message : 'Không tải hoặc cập nhật được thông báo. Vui lòng thử lại.'
}
function useSummary() {
 const { user } = useAuth()
 return useQuery({ queryKey: ['notifications', user?.id, 'summary'], queryFn: notificationApi.summary,
  enabled: !!user, refetchInterval: 30_000, staleTime: 10_000, retry: false })
}
function useReadActions() {
 const { user } = useAuth()
 const client = useQueryClient()
 const refresh = () => client.invalidateQueries({ queryKey: ['notifications', user?.id] })
 return {
  read: useMutation({ mutationFn: notificationApi.read, onSuccess: refresh }),
  all: useMutation({ mutationFn: notificationApi.readAll, onSuccess: refresh }),
 }
}
function NotificationRow({ item, compact = false, onOpen }: { item: NotificationItem; compact?: boolean; onOpen?: () => void }) {
 const { read } = useReadActions()
 const title = item.title.replace(/^\s*\[TEST\]\s*/i, '')
 const navigate = useNavigate()
 async function open() {
  if (read.isPending) return
  try {
   if (!item.readAt) await read.mutateAsync(item.id)
   onOpen?.()
   if (item.link.startsWith('/') && !item.link.startsWith('//')) navigate(item.link)
  } catch { /* Keep the item visible so the user can retry. */ }
 }
 return <article className={`notification-item ${item.readAt ? '' : 'unread'} ${compact ? 'compact' : ''}`}>
  <button type="button" className="notification-open" onClick={() => void open()} disabled={read.isPending}>
   <span className="notification-category">{notificationLabels[item.category] ?? 'Hệ thống'}{!item.readAt && <span className="notification-unread-dot" aria-label="Chưa đọc" />}</span>
   <strong>{title}</strong><span className="notification-message">{item.message}</span>
   <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('vi-VN')}</time>
  </button>
  {read.isError && <p role="alert">{notificationError(read.error)}</p>}
 </article>
}
export function NotificationBell() {
 const { user } = useAuth()
 const [open, setOpen] = useState(false)
 const summary = useSummary()
 const root = useRef<HTMLDivElement>(null)
 const trigger = useRef<HTMLButtonElement>(null)
 const location = useLocation()
 const { all } = useReadActions()
 const latest = useQuery({ queryKey: ['notifications', user?.id, 'latest'], queryFn: () => notificationApi.list(0, false, 'all', 5),
  enabled: !!user && open, refetchInterval: open ? 30_000 : false, retry: false })
 useEffect(() => setOpen(false), [location.key])
 useEffect(() => {
  if (!open) return
  function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false) }
  function escape(event: KeyboardEvent) { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() } }
  document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape)
  return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
 }, [open])
 if (!user) return null
 const count = summary.data?.unreadCount
 return <div className="notification-bell" ref={root}>
  <button type="button" className="notification-trigger" ref={trigger} aria-label={count ? `Thông báo, ${count} chưa đọc` : 'Thông báo'} aria-expanded={open} onClick={() => setOpen(value => !value)}>
   <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>
   {!!count && <span className="notification-badge">{count > 99 ? '99+' : count}</span>}
  </button>
  {open && <section className="notification-popover" aria-label="Thông báo mới nhất">
   <header><h2>Thông báo</h2><Link to="/notifications" onClick={() => setOpen(false)}>Xem tất cả</Link></header>
   {summary.isError && <p role="alert">{notificationError(summary.error)}</p>}
   {!!count && summary.data?.latestId && <button type="button" className="notification-read-all" disabled={all.isPending} onClick={() => all.mutate(summary.data!.latestId!)}>Đánh dấu tất cả đã đọc</button>}
   {all.isError && <p role="alert">{notificationError(all.error)}</p>}
   {latest.isPending && <p role="status">Đang tải thông báo...</p>}
   {latest.isError && <div role="alert"><p>{notificationError(latest.error)}</p><button onClick={() => void latest.refetch()}>Thử lại</button></div>}
   {latest.isSuccess && (latest.data.content.length ? latest.data.content.map(item => <NotificationRow key={item.id} item={item} compact onOpen={() => setOpen(false)} />) : <p className="notification-empty">Bạn chưa có thông báo mới.</p>)}
  </section>}
 </div>
}
export function NotificationsPage() {
 const { user } = useAuth()
 const [page, setPage] = useState(0)
 const [unread, setUnread] = useState(false)
 const [category, setCategory] = useState('all')
 const summary = useSummary()
 const { all } = useReadActions()
 const query = useQuery({ queryKey: ['notifications', user?.id, 'list', page, unread, category],
  queryFn: () => notificationApi.list(page, unread, category), retry: false, refetchInterval: 30_000 })
 return <main className="notifications-page">
  <header><div><h1>Thông báo của bạn</h1><p>{summary.isSuccess ? `${summary.data.unreadCount} thông báo chưa đọc` : 'Cập nhật về học tập và công việc của bạn.'}</p></div>
   <button disabled={all.isPending || !summary.data?.unreadCount || !summary.data.latestId} onClick={() => all.mutate(summary.data!.latestId!, { onSuccess: () => setPage(0) })}>Đánh dấu tất cả đã đọc</button></header>
  <div className="notification-filters"><label><input type="checkbox" checked={unread} onChange={e => { setUnread(e.target.checked); setPage(0) }} /> Chỉ chưa đọc</label>
   <label>Nhóm thông báo <select value={category} onChange={e => { setCategory(e.target.value); setPage(0) }}><option value="all">Tất cả</option>{Object.entries(notificationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
   <button onClick={() => { void query.refetch(); void summary.refetch() }}>Làm mới</button></div>
  {all.isError && <p role="alert">{notificationError(all.error)}</p>}
  {summary.isError && <p role="alert">{notificationError(summary.error)}</p>}
  {query.isPending && <p role="status">Đang tải thông báo...</p>}
  {query.isError && <div role="alert"><p>{notificationError(query.error)}</p><button onClick={() => void query.refetch()}>Thử lại</button></div>}
  {query.isSuccess && <><div className="notification-list">{query.data.content.map(item => <NotificationRow key={item.id} item={item} />)}</div>
   {!query.data.content.length && <p className="notification-empty">Không có thông báo phù hợp.</p>}
   {query.data.totalPages > 1 && <nav className="notification-pagination" aria-label="Trang thông báo"><button disabled={page === 0 || query.isFetching} onClick={() => setPage(p => p - 1)}>Trước</button><span>Trang {page + 1}/{query.data.totalPages}</span><button disabled={page + 1 >= query.data.totalPages || query.isFetching} onClick={() => setPage(p => p + 1)}>Sau</button></nav>}
  </>}
 </main>
}
