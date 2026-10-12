import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { paymentApi } from '../../features/payment/api/paymentApi'

export function usePayment(id: number, poll = false) {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['payment', id], queryFn: () => paymentApi.status(id), enabled: Number.isSafeInteger(id) && id > 0,
    refetchInterval: poll ? query => query.state.data?.status === 'PENDING' ? 3000 : false : false })
  const status = query.data?.status
  useEffect(() => {
    if (status === 'SUCCEEDED') {
      void client.invalidateQueries({ queryKey: ['student-courses'] })
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
