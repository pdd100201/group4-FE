import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './features/auth/screens/auth.css'
import './shared/styles/ui-enhancements.css'
import App from './App'
import { AuthProvider } from './shared/context/AuthContext'

const queryClient = new QueryClient()
createRoot(document.getElementById('root')!).render(
  <StrictMode><QueryClientProvider client={queryClient}><AuthProvider><App /></AuthProvider></QueryClientProvider></StrictMode>,
)
