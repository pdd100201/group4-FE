import { useQuery } from '@tanstack/react-query'
import { reportApi } from '../../features/reports/api/reportApi'
import type { ReportKind } from '../types/report'
export function useAvailableReports() {
  return useQuery({ queryKey: ['reports', 'available'], queryFn: reportApi.available, retry: false })
}
export function useReport(kind: ReportKind, params: URLSearchParams, enabled: boolean) {
  return useQuery({
    queryKey: ['reports', kind, params.toString()],
    queryFn: () => reportApi.read(kind, params), enabled, retry: false,
  })
}
