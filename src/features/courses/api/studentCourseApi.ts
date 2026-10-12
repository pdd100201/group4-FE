import apiClient from '../../../shared/services/apiClient'

export interface StudentCourse {
  registrationId: number
  courseId: number
  title: string
  category: string | null
  expertName: string
  thumbnailUrl: string | null
  packageName: string | null
  validFrom: string
  validUntil: string | null
  lifetime: boolean
  available: boolean
}
export interface StudentCoursePage {
  content: StudentCourse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
export const studentCourseApi = {
  list: async (page: number, q: string, sort: string) => (await apiClient.get<StudentCoursePage>('/student/courses', { params: { page, size: 12, q, sort } })).data,
}
