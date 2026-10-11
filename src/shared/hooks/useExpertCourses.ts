import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expertCourseApi, type CourseFilters, type CourseInput } from '../../features/expert/api/expertCourseApi'
export function useExpertCourses(filters: CourseFilters) { return useQuery({ queryKey: ['expert-courses', filters], queryFn: () => expertCourseApi.list(filters) }) }
export function useExpertCourse(id?: number) { return useQuery({ queryKey: ['expert-course', id], queryFn: () => expertCourseApi.get(id!), enabled: id !== undefined && Number.isSafeInteger(id) && id > 0 }) }
export function useSubmissionReadiness(id?: number) { return useQuery({ queryKey: ['course-submission-readiness', id], queryFn: () => expertCourseApi.readiness(id!), enabled: id !== undefined && Number.isSafeInteger(id) && id > 0 }) }
export function useCourseActions() {
  const client = useQueryClient()
  const refresh = async () => { await Promise.all(['expert-courses', 'expert-course', 'published-courses', 'public-course', 'manager-courses', 'manager-course', 'moderation-courses', 'course-submission-readiness'].map(key => client.invalidateQueries({ queryKey: [key] }))) }
  return {
    save: useMutation({ mutationFn: ({ id, input }: { id?: number; input: CourseInput }) => id === undefined ? expertCourseApi.create(input) : expertCourseApi.update(id, input), onSuccess: refresh }),
    remove: useMutation({ mutationFn: expertCourseApi.remove, onSuccess: refresh }),
    submit: useMutation({ mutationFn: expertCourseApi.submit, onSuccess: refresh }),
  }
}
