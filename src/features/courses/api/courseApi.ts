import apiClient from '../../../shared/services/apiClient'
import type { CoursePackage } from '../../registrations/api/registrationApi'

export interface CourseSummary {
  id: number
  title: string
  description: string | null
  category: string | null
  price: number | null
  thumbnailUrl: string | null
  expertName: string | null
}

export interface PublicCourseDetail extends CourseSummary {
  lessons: { id: number; title: string; position: number | null }[]
  quizCount: number
  packages: CoursePackage[]
}

export const courseApi = {
  enrollment: async (id: number) => (await apiClient.get<{ hasAccess: boolean; registrationId: number | null; packageName: string | null; status: string | null; validUntil: string | null; lifetime: boolean }>(`/student/courses/${id}/enrollment`)).data,
  getPublished: async (id: number): Promise<PublicCourseDetail> => (await apiClient.get<PublicCourseDetail>(`/public/courses/${id}`)).data,
  listPublished: async (params: { search?: string; category?: string } = {}): Promise<CourseSummary[]> => {
    const response = await apiClient.get<CourseSummary[]>('/public/courses', { params })
    return response.data
  },
}
