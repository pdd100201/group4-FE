import apiClient from '../../../shared/services/apiClient'
export type PackageDuration = 'ONE_MONTH' | 'ONE_YEAR' | 'LIFETIME'
export interface CoursePackage { id: number; duration: PackageDuration; name: string; durationMonths: number | null; lifetime: boolean; price: number; discountPercent: number; discountAmount: number; finalPrice: number; active: boolean }
export interface PackageInput { duration: PackageDuration; price: number; discountPercent: number; active: boolean }
export interface StudentRegistration { id: number; courseId: number; courseTitle: string; packageId: number | null; packageName: string | null; packageDuration: PackageDuration | null; durationMonths: number | null; lifetime: boolean; originalPrice: number | null; discountPercent: number | null; discountAmount: number | null; amount: number; currency: string; status: 'PENDING_PAYMENT' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'FAILED'; createdAt: string; validFrom: string | null; validUntil: string | null; fullName: string; email: string; phone: string | null; reused: boolean; paymentPending: boolean }
export interface RegistrationInput { courseId: number; packageId: number; fullName: string; phone: string }
export const registrationApi = {
  create: async (input: RegistrationInput) => (await apiClient.post<StudentRegistration>('/student/registrations', input)).data,
  detail: async (id: number) => (await apiClient.get<StudentRegistration>(`/student/registrations/${id}`)).data,
  list: async (params: URLSearchParams) => (await apiClient.get<{ content: StudentRegistration[]; totalElements: number; totalPages: number }>('/student/registrations', { params })).data,
}
