import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerPostApi, type PostManagementRole } from '../../features/management/api/managerPostApi'

export function useManagerPosts(page: number, size = 10, role: PostManagementRole = 'manager') {
  return useQuery({ queryKey: ['manager-posts', role, page, size], queryFn: () => managerPostApi.list(page, size, role) })
}

export function useManagerPostActions(role: PostManagementRole = 'manager') {
  const client = useQueryClient()
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['manager-posts'] }),
      client.invalidateQueries({ queryKey: ['manager-post'] }),
      client.invalidateQueries({ queryKey: ['manager-post-number'] }),
      client.invalidateQueries({ queryKey: ['public-posts'] }),
      client.invalidateQueries({ queryKey: ['public-post-categories'] }),
      client.invalidateQueries({ queryKey: ['public-post'] }),
    ])
  }
  const create = useMutation({ mutationFn: (input: Parameters<typeof managerPostApi.create>[0]) => managerPostApi.create(input, role), onSuccess: refresh })
  const update = useMutation({ mutationFn: ({ id, input }: { id: number; input: Parameters<typeof managerPostApi.update>[1] }) => managerPostApi.update(id, input, role), onSuccess: refresh })
  const remove = useMutation({ mutationFn: (id: number) => managerPostApi.delete(id, role), onSuccess: refresh })
  const review = useMutation({ mutationFn: ({ id, decision }: { id: number; decision: 'APPROVE' | 'REJECT' }) => managerPostApi.review(id, decision, role), onSuccess: refresh })
  return { create, update, remove, review }
}
