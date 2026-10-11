import apiClient from '../../../shared/services/apiClient'

export interface CourseSummary {
  id: number
  title: string
  description: string | null
  category: string | null
  price: number | null
}

export const courseApi = {
  listPublished: async (): Promise<CourseSummary[]> => {
    const response = await apiClient.get<CourseSummary[]>('/public/courses')
    return response.data
  },
}
