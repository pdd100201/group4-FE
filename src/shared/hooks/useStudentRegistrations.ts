import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { registrationApi } from '../../features/registrations/api/registrationApi'
export function useStudentRegistrations(page: number) { return useQuery({ queryKey: ['student-registrations', page], queryFn: () => registrationApi.list(page) }) }
export function useStudentRegistration(id: number) { return useQuery({ queryKey: ['student-registration', id], queryFn: () => registrationApi.detail(id), enabled: Number.isSafeInteger(id) && id > 0 }) }
export function useCreateRegistration() {
  const client = useQueryClient()
  return useMutation({ mutationFn: registrationApi.create, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['student-registrations'] }) } })
}
