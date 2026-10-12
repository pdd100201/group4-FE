import { useQuery } from '@tanstack/react-query'
import { authApi } from '../../features/auth/api/authApi'

export function useGoogleConfiguration() {
  return useQuery({
    queryKey: ['auth', 'public-configuration'],
    queryFn: authApi.configuration,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })
}
