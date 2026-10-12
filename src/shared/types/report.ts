import type { ManagementPage } from './management'
export type ReportKind = 'COURSES' | 'REGISTRATIONS' | 'REVENUE'
export interface ReportRow {
  id: number
  courseTitle: string
  status: string | null
  count: number | null
  amount: number | null
  studentName: string | null
  studentEmail: string | null
  createdAt: string | null
  demo: boolean
}
export interface ReportResponse {
  kind: ReportKind
  records: ManagementPage<ReportRow>
  totalAmount: number
}
