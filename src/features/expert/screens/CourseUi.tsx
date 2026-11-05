import { useEffect, useId, useRef, type ReactNode } from 'react'

export function CourseIcon({ name }: { name: string }) {
 const paths: Record<string, ReactNode> = {
  book: <><path d="M4 3h6a3 3 0 0 1 3 3v15a4 4 0 0 0-4-2H4z" /><path d="M20 3h-4a3 3 0 0 0-3 3v15a4 4 0 0 1 4-2h3z" /></>,
  info: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
  price: <><path d="m3 12 9 9 9-9V3h-9z" /><circle cx="16" cy="8" r="1" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  next: <path d="m9 5 7 7-7 7M3 12h13" />,
  back: <path d="m15 5-7 7 7 7M8 12h13" />,
  image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  list: <path d="M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1" />,
 }
 return <svg className="studio-icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] ?? paths.book}</svg>
}
export function CourseDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
 const ref = useRef<HTMLDialogElement>(null)
 const id = useId()
 useEffect(() => {
  const previous = document.activeElement as HTMLElement | null
  ref.current?.showModal()
  return () => { ref.current?.close(); previous?.focus() }
 }, [])
 return <dialog ref={ref} className="studio-dialog" aria-labelledby={id} onCancel={event => { event.preventDefault(); onClose() }}><header><h2 id={id}>{title}</h2><button type="button" aria-label="Đóng hộp thoại" onClick={onClose}>×</button></header>{children}</dialog>
}