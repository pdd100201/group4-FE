import apiClient from '../../../shared/services/apiClient'
import type { PasswordChange, Profile, ProfileUpdate } from '../../../shared/types/profile'
import type { ApiMessage } from '../../../shared/types/auth'

export const profileApi = {
  current: async () => (await apiClient.get<Profile>('/profile')).data,
  update: async (request: ProfileUpdate) => (await apiClient.patch<Profile>('/profile', request)).data,
  changePassword: async (request: PasswordChange) => (await apiClient.post<ApiMessage>('/profile/change-password', request)).data,
}
