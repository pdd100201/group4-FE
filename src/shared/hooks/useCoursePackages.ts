import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { coursePackageApi } from '../../features/expert/api/coursePackageApi'
import type { PackageInput } from '../../features/registrations/api/registrationApi'
export function useCoursePackages(id: number) { return useQuery({ queryKey: ['course-packages', id], queryFn: () => coursePackageApi.get(id) }) }
export function useSaveCoursePackages(id: number) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (input: PackageInput[]) => coursePackageApi.save(id, input), onSuccess: async () => { await Promise.all(['course-packages', 'public-course', 'published-courses', 'course-submission-readiness'].map(key => client.invalidateQueries({ queryKey: [key] }))) } })
}
