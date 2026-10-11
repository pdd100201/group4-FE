import apiClient from '../api/apiClient'
export interface LessonInput { title: string; content: string; position: number; active: boolean; videoMediaId?: number | null }
export interface Lesson extends LessonInput { id: number }
export const lessonService = {
  list: async (courseId: number) => (await apiClient.get<Lesson[]>(`/expert/courses/${courseId}/lessons`)).data,
  save: async ({ courseId, id, input }: { courseId: number; id?: number; input: LessonInput }) => (await (id === undefined ? apiClient.post<Lesson>(`/expert/courses/${courseId}/lessons`, input) : apiClient.put<Lesson>(`/expert/courses/${courseId}/lessons/${id}`, input))).data,
  remove: async ({ courseId, id }: { courseId: number; id: number }) => { await apiClient.delete(`/expert/courses/${courseId}/lessons/${id}`) },
}
