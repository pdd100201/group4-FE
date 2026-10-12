import { useQuery } from '@tanstack/react-query'
import { authApi } from '../../features/auth/api/authApi'

export function useEmailVerification(token: string | null) {
  return useQuery({
    queryKey: ['email-verification', token],
    queryFn: () => authApi.verifyEmail(token!),
    enabled: Boolean(token),
    // Verification consumes the token; deduplicate mounts and never retry automatically.
    staleTime: Infinity,
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
