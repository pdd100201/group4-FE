import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePublishedCourses } from '../../../shared/hooks/usePublishedCourses'
import { PublicCourseCard } from './PublicCourseCard'
import './public-courses.css'

const prices = [['all', 'Tất cả mức giá'], ['under500', 'Dưới 500.000đ'], ['500to1000', 'Từ 500.000đ - 1.000.000đ'], ['over1000', 'Trên 1.000.000đ']] as const
const sorts = [['newest', 'Mới nhất'], ['priceAsc', 'Giá tăng dần'], ['priceDesc', 'Giá giảm dần'], ['title', 'Tên khóa học A–Z']] as const
const pageSize = 6
export function CourseCatalogPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') || ''
  const selected = params.getAll('category')
  const price = prices.some(([key]) => key === params.get('price')) ? params.get('price')! : 'all'
  const sort = sorts.some(([key]) => key === params.get('sort')) ? params.get('sort')! : 'newest'
  const [draftSearch, setDraftSearch] = useState(search)
  const [draftCategories, setDraftCategories] = useState(selected)
  const [draftPrice, setDraftPrice] = useState(price)
  const serialized = params.toString()
  useEffect(() => { setDraftSearch(search); setDraftCategories(params.getAll('category')); setDraftPrice(price) }, [serialized])
  const { data: courses = [], isLoading, isError, refetch } = usePublishedCourses()
  const categories = [...new Set(courses.map(course => course.category?.trim()).filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b, 'vi'))
  const results = courses.filter(course => {
    if (!course.title.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))) return false
    if (selected.length && !selected.includes(course.category?.trim() || '')) return false
    if (price === 'all') return true
    if (course.price == null) return false
    return price === 'under500' ? course.price < 500000 : price === '500to1000' ? course.price >= 500000 && course.price <= 1000000 : course.price > 1000000
  }).sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'vi') : sort === 'newest' ? b.id - a.id : a.price == null ? (b.price == null ? 0 : 1) : b.price == null ? -1 : sort === 'priceAsc' ? a.price - b.price : b.price - a.price)
  const pages = Math.max(1, Math.ceil(results.length / pageSize))
  const rawPage = Number(params.get('page') || 1)
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, pages) : 1
  function apply() {
    const next = new URLSearchParams(params)
    next.delete('category'); draftCategories.forEach(value => next.append('category', value))
    if (draftSearch.trim()) next.set('search', draftSearch.trim()); else next.delete('search')
    if (draftPrice !== 'all') next.set('price', draftPrice); else next.delete('price')
    next.delete('page'); setParams(next)
  }
  function update(key: string, value: string) { const next = new URLSearchParams(params); next.set(key, value); if (key !== 'page') next.delete('page'); setParams(next) }
  return <section className="landing-section course-catalog">
    <div className="catalog-breadcrumb"><Link to="/">Trang chủ</Link><span>/</span>Danh sách khóa học</div>
    <h1>Tất cả khóa học trực tuyến</h1><p className="catalog-intro">Khám phá {isLoading || isError ? '' : `${courses.length} `}khóa học và lựa chọn hành trình học tập của bạn.</p>
    <form className="catalog-layout" onSubmit={event => { event.preventDefault(); apply() }}>
      <aside className="catalog-filters" aria-label="Bộ lọc khóa học"><div className="catalog-filter-heading"><h2>Bộ lọc tìm kiếm</h2><button type="button" onClick={() => { setDraftSearch(''); setDraftCategories([]); setDraftPrice('all'); setParams({}) }}>Đặt lại</button></div>
        <fieldset><legend>Danh mục</legend>{categories.map(category => <label key={category}><input type="checkbox" checked={draftCategories.includes(category)} onChange={event => setDraftCategories(current => event.target.checked ? [...current, category] : current.filter(value => value !== category))} /><span>{category}</span><small>({courses.filter(course => course.category?.trim() === category).length})</small></label>)}{!isLoading && !isError && !categories.length && <p>Chưa có danh mục.</p>}</fieldset>
        <fieldset><legend>Khoảng giá gói học</legend>{prices.map(([value, label]) => <label key={value}><input type="radio" name="catalog-price" value={value} checked={draftPrice === value} onChange={() => setDraftPrice(value)} /><span>{label}</span></label>)}</fieldset>
        <button type="submit" className="primary-button catalog-apply">Áp dụng bộ lọc</button>
      </aside>
      <div className="catalog-results"><div className="catalog-toolbar"><label className="catalog-search"><span aria-hidden="true">⌕</span><input aria-label="Tìm khóa học" placeholder="Tìm khóa học bạn quan tâm..." maxLength={255} value={draftSearch} onChange={event => setDraftSearch(event.target.value)} /><button type="submit" aria-label="Tìm kiếm khóa học">Tìm</button></label><label className="catalog-sort">Sắp xếp:<select aria-label="Sắp xếp khóa học" value={sort} onChange={event => update('sort', event.target.value)}>{sorts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
        {isLoading && <p role="status">Đang tải khóa học...</p>}
        {isError && <div role="alert">Không tải được khóa học. <button type="button" onClick={() => refetch()}>Thử lại</button></div>}
        {!isLoading && !isError && <><p className="catalog-result-count" role="status">{results.length ? `Hiển thị ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, results.length)} trong ${results.length} khóa học` : 'Không có khóa học phù hợp. Hãy thử thay đổi hoặc đặt lại bộ lọc.'}</p><div className="course-grid">{results.slice((page - 1) * pageSize, page * pageSize).map(course => <PublicCourseCard key={course.id} course={course} />)}</div>
        {pages > 1 && <nav className="catalog-pagination" aria-label="Trang khóa học"><button type="button" disabled={page === 1} onClick={() => update('page', String(page - 1))} aria-label="Trang trước">‹</button>{Array.from({ length: pages }, (_, index) => index + 1).filter(value => value === 1 || value === pages || Math.abs(value - page) <= 1).map((value, index, list) => <span key={value}>{index > 0 && value - list[index - 1] > 1 && <span className="catalog-page-gap">…</span>}<button type="button" aria-label={`Trang ${value}`} aria-current={page === value ? 'page' : undefined} onClick={() => update('page', String(value))}>{value}</button></span>)}<button type="button" disabled={page === pages} onClick={() => update('page', String(page + 1))} aria-label="Trang tiếp theo">›</button></nav>}</>}
      </div>
    </form>
  </section>
}
