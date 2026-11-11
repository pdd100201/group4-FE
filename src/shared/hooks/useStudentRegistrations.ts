import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { registrationApi } from '../../features/registrations/api/registrationApi'
import { useAuth } from '../context/AuthContext'
export function useStudentRegistrations(params: URLSearchParams) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['student-registrations', user?.id, params.toString()], queryFn: () => registrationApi.list(params), enabled: Boolean(user) })
}
export function useStudentRegistration(id: number) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['student-registration', id, user?.id], queryFn: () => registrationApi.detail(id), enabled: Boolean(user) && Number.isSafeInteger(id) && id > 0 })
}
export function useCancelRegistration() {
  const client = useQueryClient()
  const { user } = useAuth()
  return useMutation({ mutationFn: registrationApi.cancel, onSuccess: registration => {
    client.setQueryData(['student-registration', registration.id, user?.id], registration)
  }, onSettled: async () => {
    await Promise.all(['student-registrations', 'student-registration', 'payment', 'course-enrollment', 'published-courses', 'student-courses', 'notifications', 'expert-course-students', 'expert-student-courses'].map(key => client.invalidateQueries({ queryKey: [key] })))
  } })
}
export function useCreateRegistration() {
  const client = useQueryClient()
  return useMutation({ mutationFn: registrationApi.create, onSuccess: async () => { await Promise.all(['student-registrations', 'published-courses', 'course-enrollment'].map(key => client.invalidateQueries({ queryKey: [key] }))) } })
}
