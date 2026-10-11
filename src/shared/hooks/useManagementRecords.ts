import { useQuery } from '@tanstack/react-query'
import { managementApi } from '../../features/management/api/managementApi'
import type { ManagementKind, ManagementScope } from '../types/management'

export function useManagementRecords(scope: ManagementScope, kind: ManagementKind, params: URLSearchParams) {
  return useQuery({
    queryKey: ['management', scope, kind, params.toString()],
    queryFn: () => managementApi.list(scope, kind, params),
  })
}
export function useManagementRecord(scope: ManagementScope, kind: ManagementKind, id: string) {
  return useQuery({
    queryKey: ['management', scope, kind, id],
    queryFn: () => managementApi.detail(scope, kind, id),
    enabled: /^\d+$/.test(id) && Number(id) > 0,
    retry: false,
  })
}
