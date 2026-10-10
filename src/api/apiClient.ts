import axios, { type InternalAxiosRequestConfig } from 'axios'
import { authStorage } from '../utils/authStorage'
import type { TokenResponse } from '../types/auth'

const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1' })
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.accessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const refreshToken = authStorage.refreshToken()
    if (error.response?.status === 401 && !original._retry && refreshToken && !original.url?.startsWith('/auth/')) {
      original._retry = true
      try {
        const refresh = await axios.post<TokenResponse>(`${apiClient.defaults.baseURL}/auth/refresh`, { refreshToken })
        authStorage.updateTokens(refresh.data)
        original.headers.Authorization = `Bearer ${refresh.data.accessToken}`
        return apiClient(original)
      } catch { authStorage.clear(); window.location.assign('/login?session=expired') }
    }
    return Promise.reject(error)
  },
)
export default apiClient
