import { useQuery } from '@tanstack/react-query'
import { blogApi, type PostFilters } from '../../features/blog/api/blogApi'

export function useBlogPosts(filters: PostFilters = {}) {
  return useQuery({ queryKey: ['public-posts', filters], queryFn: () => blogApi.list(filters) })
}
export function useBlogCategories() {
  return useQuery({ queryKey: ['public-post-categories'], queryFn: blogApi.categories })
}
export function useBlogDetail(id: number) {
  return useQuery({ queryKey: ['public-post', id], queryFn: () => blogApi.detail(id), enabled: Number.isSafeInteger(id) && id > 0 })
}
