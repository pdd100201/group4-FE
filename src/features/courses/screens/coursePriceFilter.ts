import type { CourseSummary } from '../api/courseApi'

export function matchesCoursePrice(course: CourseSummary, range: string): boolean {
  if (range === 'all') return true
  const prices = course.packagePrices ?? (course.price == null ? [] : [course.price])
  return prices.some(price => range === 'under500' ? price < 500000
    : range === '500to1000' ? price >= 500000 && price <= 1000000
    : range === 'over1000' ? price > 1000000 : false)
}
