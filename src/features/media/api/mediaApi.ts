import apiClient from '../../../shared/services/apiClient'
export type MediaPurpose = 'AVATAR' | 'COURSE_IMAGE' | 'LESSON_VIDEO' | 'CONTENT_IMAGE' | 'QUESTION_IMAGE'
export interface UploadedMedia { id: number; url: string | null; resourceType: 'image' | 'video'; bytes: number }
export const mediaApi = {
  upload: async (file: File, purpose: MediaPurpose, courseId: number | undefined, progress: (percent: number) => void) => {
    const data = new FormData(); data.append('file', file); data.append('purpose', purpose)
    if (courseId !== undefined) data.append('courseId', String(courseId))
    return (await apiClient.post<UploadedMedia>('/media', data, { timeout: 240000, onUploadProgress: e => { if (e.total) progress(Math.min(99, Math.round(e.loaded * 100 / e.total))) } })).data
  },
  playback: async (id: number) => (await apiClient.get<{ url: string }>(`/media/${id}/playback`)).data.url,
}
