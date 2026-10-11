export type ManagementScope = 'admin' | 'manager'
export type ManagementKind = 'registrations' | 'transactions'
export interface ManagementPage<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
export interface RegistrationRecord {
  id: number
  studentId: number
  studentName: string
  studentEmail: string
  courseId: number
  courseTitle: string
  status: string
  packageName: string | null
  originalPrice: number | null
  discount: number | null
  amount: number | null
  validityDays: number | null
  createdAt: string | null
  validFrom: string | null
  validUntil: string | null
  note: string | null
}
export interface TransactionRecord {
  id: number
  paymentId: number
  amount: number
  type: string
  provider: string | null
  providerReference: string | null
  status: string
  createdAt: string | null
  registration: RegistrationRecord
}
export type ManagementRecord = RegistrationRecord | TransactionRecord
