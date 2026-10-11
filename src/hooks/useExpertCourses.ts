import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expertCourseService, type CourseFilters, type CourseInput } from '../services/expertCourseService'
export function useExpertCourses(filters: CourseFilters) { return useQuery({ queryKey: ['expert-courses', filters], queryFn: () => expertCourseService.list(filters) }) }
export function useExpertCourse(id?: number) { return useQuery({ queryKey: ['expert-course', id], queryFn: () => expertCourseService.get(id!), enabled: id !== undefined && Number.isSafeInteger(id) && id > 0 }) }
export function useSubmissionReadiness(id?: number) { return useQuery({ queryKey: ['course-submission-readiness', id], queryFn: () => expertCourseService.readiness(id!), enabled: id !== undefined && Number.isSafeInteger(id) && id > 0 }) }
export function useCourseActions() {
  const client = useQueryClient()
  const refresh = async () => { await Promise.all(['expert-courses', 'expert-course', 'published-courses', 'public-course', 'manager-courses', 'manager-course', 'moderation-courses', 'course-submission-readiness'].map(key => client.invalidateQueries({ queryKey: [key] }))) }
  return {
    save: useMutation({ mutationFn: ({ id, input }: { id?: number; input: CourseInput }) => id === undefined ? expertCourseService.create(input) : expertCourseService.update(id, input), onSuccess: refresh }),
    remove: useMutation({ mutationFn: expertCourseService.remove, onSuccess: refresh }),
    submit: useMutation({ mutationFn: expertCourseService.submit, onSuccess: refresh }),
  }
}
