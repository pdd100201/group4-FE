import { useEffect, useState, type FormEvent } from 'react'
import { useCoursePackages, useSaveCoursePackages } from '../../../shared/hooks/useCoursePackages'
import type { CoursePackage, PackageDuration, PackageInput } from '../../registrations/api/registrationApi'
import { courseError } from './ExpertCoursesPage'
const durations: Array<[PackageDuration, string]> = [['ONE_MONTH', '1 tháng'], ['ONE_YEAR', '1 năm'], ['LIFETIME', 'Vĩnh viễn']]
export function CoursePackagesPanel({ id, disabled, onDirty, onBusy }: { id: number; disabled: boolean; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void }) {
  const query = useCoursePackages(id)
  useEffect(() => { onBusy(query.isFetching); return () => onBusy(false) }, [query.isFetching, onBusy])
  if (query.isPending) return <p role="status">Đang tải gói học…</p>
  if (query.isError) return <div role="alert">{courseError(query.error)} <button onClick={() => void query.refetch()}>Thử lại</button></div>
  return <PackageForm key={JSON.stringify(query.data)} id={id} initial={query.data} disabled={disabled} onDirty={onDirty} onBusy={onBusy} />
}
function PackageForm({ id, initial, disabled, onDirty, onBusy }: { id: number; initial: CoursePackage[]; disabled: boolean; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void }) {
  const saved = durations.map(([duration]) => { const p = initial.find(p => p.duration === duration); return { duration, price: p ? String(p.price) : '', discountPercent: p ? String(p.discountPercent) : '0', active: p?.active ?? true } })
  const [form, setForm] = useState(saved)
  const save = useSaveCoursePackages(id)
  const dirty = JSON.stringify(form) !== JSON.stringify(saved) || initial.length !== 3
  useEffect(() => { onDirty(dirty); return () => onDirty(false) }, [dirty, onDirty])
  useEffect(() => { onBusy(save.isPending); return () => onBusy(false) }, [save.isPending, onBusy])
  async function submit(event: FormEvent) {
    event.preventDefault()
    const input: PackageInput[] = form.map(p => ({ ...p, price: Number(p.price), discountPercent: Number(p.discountPercent) }))
    try { await save.mutateAsync(input) } catch { /* Render server validation below. */ }
  }
  return <form className="course-panel package-panel" onSubmit={event => void submit(event)}><h2>Gói giá và thời hạn</h2><p>Giá nguyên VNĐ; giảm giá 0–100%. Tắt gói để ngừng đăng ký mới. Đăng ký cũ giữ nguyên giá đã chốt.</p>
    <fieldset disabled={disabled || save.isPending}>{form.map((p, index) => <section key={p.duration} className="package-editor"><h3>{durations[index][1]}</h3>
      <label>Giá gốc {durations[index][1]} (VNĐ)<input required type="number" min="0" max="9999999999" step="1" value={p.price} onChange={e => setForm(current => current.map((item, i) => i === index ? { ...item, price: e.target.value } : item))} /></label>
      <label>Giảm giá {durations[index][1]} (%)<input required type="number" min="0" max="100" step="0.01" value={p.discountPercent} onChange={e => setForm(current => current.map((item, i) => i === index ? { ...item, discountPercent: e.target.value } : item))} /></label>
      <label><input type="checkbox" checked={p.active} onChange={e => setForm(current => current.map((item, i) => i === index ? { ...item, active: e.target.checked } : item))} /> Mở đăng ký gói {durations[index][1]}</label>
    </section>)}<button className="course-primary" disabled={!dirty} type="submit">{save.isPending ? 'Đang lưu gói…' : 'Lưu các gói giá'}</button></fieldset>
    {save.isError && <p role="alert" className="course-error">{courseError(save.error)}</p>}
  </form>
}
