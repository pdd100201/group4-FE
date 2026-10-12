import apiClient from '../../../shared/services/apiClient'
import type { CoursePackage, PackageInput } from '../../registrations/api/registrationApi'
export const coursePackageApi = {
  get: async (id: number) => (await apiClient.get<CoursePackage[]>(`/expert/courses/${id}/packages`)).data,
  save: async (id: number, packages: PackageInput[]) => (await apiClient.put<CoursePackage[]>(`/expert/courses/${id}/packages`, { packages })).data,
}
