import apiClient from '../../../shared/services/apiClient'

export interface PaymentResponse {
  registrationId: number
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  configured: boolean
  testMode: boolean
  qrUrl: string | null
  bank: string | null
  accountNumber: string | null
  accountHolder: string | null
  transferContent: string | null
  amount: number
  expiresAt: string | null
  serverTime: string
  expired: boolean
}
export const paymentApi = {
  initiate: async (id: number) => (await apiClient.post<PaymentResponse>(`/student/registrations/${id}/payment`)).data,
  status: async (id: number) => (await apiClient.get<PaymentResponse>(`/student/registrations/${id}/payment`)).data,
}
