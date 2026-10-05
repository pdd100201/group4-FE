import axios, { type InternalAxiosRequestConfig } from 'axios'

const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1' })
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry && localStorage.getItem('refreshToken')) {
      original._retry = true
      try {
        const refresh = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, { refreshToken: localStorage.getItem('refreshToken') })
        localStorage.setItem('accessToken', refresh.data.accessToken)
        original.headers.Authorization = `Bearer ${refresh.data.accessToken}`
        return apiClient(original)
      } catch { localStorage.clear(); window.location.assign('/login') }
    }
    return Promise.reject(error)
  },
)
export default apiClient
