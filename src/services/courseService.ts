import apiClient from '../api/apiClient'

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
}

export const courseService = {
  getPublished: async (id: number): Promise<PublicCourseDetail> => (await apiClient.get<PublicCourseDetail>(`/public/courses/${id}`)).data,
  listPublished: async (): Promise<CourseSummary[]> => {
    const response = await apiClient.get<CourseSummary[]>('/public/courses')
    return response.data
  },
}
