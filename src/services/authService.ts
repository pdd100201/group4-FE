import apiClient from '../api/apiClient'
import type { ApiMessage, RegisterRequest, TokenResponse } from '../types/auth'
export const authService = {
  login: (email: string, password: string) => apiClient.post<TokenResponse>('/auth/login', { email, password }),
  googleLogin: (credential: string) => apiClient.post<TokenResponse>('/auth/google', { credential }),
  register: (request: RegisterRequest) => apiClient.post<ApiMessage>('/auth/register', request),
  verifyEmail: (token: string) => apiClient.post<ApiMessage>('/auth/verify-email', { token }),
  resendVerification: (email: string) => apiClient.post<ApiMessage>('/auth/resend-verification', { email }),
  resetPassword: (token: string, newPassword: string) => apiClient.post<ApiMessage>('/auth/reset-password', { token, newPassword }),
  forgotPassword: (email: string) => apiClient.post<ApiMessage>('/auth/forgot-password', { email }),
  logout: (refreshToken: string) => apiClient.post<ApiMessage>('/auth/logout', { refreshToken }),
}
