import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { paymentApi } from '../../features/payment/api/paymentApi'
import { useAuth } from '../context/AuthContext'

export function usePayment(id: number, poll = false) {
  const client = useQueryClient()
  const { user } = useAuth()
  const query = useQuery({ queryKey: ['payment', id, user?.id], queryFn: () => paymentApi.status(id), enabled: Boolean(user) && Number.isSafeInteger(id) && id > 0,
    refetchInterval: poll ? query => query.state.data?.status === 'PENDING' ? 3000 : false : false })
  const status = query.data?.status
  useEffect(() => {
    if (status === 'SUCCEEDED' || status === 'CANCELLED') {
      if (status === 'SUCCEEDED') void client.invalidateQueries({ queryKey: ['student-courses'] })
      void client.invalidateQueries({ queryKey: ['student-registrations'] })
      void client.invalidateQueries({ queryKey: ['student-registration', id] })
    }
  }, [status, id, client])
  return query
}
export function useInitiatePayment(id: number) {
  const client = useQueryClient()
  return useMutation({ mutationFn: () => paymentApi.initiate(id), onSuccess: () => client.invalidateQueries({ queryKey: ['payment', id] }) })
}
