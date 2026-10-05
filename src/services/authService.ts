import apiClient from '../api/apiClient'
import type { TokenResponse } from '../types/auth'
export const authService = {
  login: (email: string, password: string) => apiClient.post<TokenResponse>('/auth/login', { email, password }),
  register: (fullName: string, email: string, password: string) => apiClient.post('/auth/register', { fullName, email, password }),
  resetPassword: (token: string, newPassword: string) => apiClient.post('/auth/reset-password', { token, newPassword }),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
}
