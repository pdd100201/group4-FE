import type { ChartPoint } from './ReportChart'

export function countByStatus<T extends { status: string | null }>(rows: readonly T[], labels: Record<string, string>): ChartPoint[] {
  const counts = new Map<string, number>()
  for (const { status } of rows) {
    const label = status ? labels[status] ?? status : 'Chưa lưu'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return Array.from(counts, ([label, value]) => ({ label, value }))
}
