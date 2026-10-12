import { useQuery } from '@tanstack/react-query'
import { studentCourseApi } from '../../features/courses/api/studentCourseApi'
import { useAuth } from '../context/AuthContext'

export function useStudentCourses(page: number, q: string, sort: string) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['student-courses', user?.id, page, q, sort], queryFn: () => studentCourseApi.list(page, q, sort), enabled: Boolean(user) })
}
