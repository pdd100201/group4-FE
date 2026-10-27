import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerPostApi } from '../../features/management/api/managerPostApi'

export function useManagerPosts(page: number, size = 10) {
  return useQuery({ queryKey: ['manager-posts', page, size], queryFn: () => managerPostApi.list(page, size) })
}

export function useManagerPostActions() {
  const client = useQueryClient()
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['manager-posts'] }),
      client.invalidateQueries({ queryKey: ['manager-post'] }),
      client.invalidateQueries({ queryKey: ['public-posts'] }),
      client.invalidateQueries({ queryKey: ['public-post-categories'] }),
      client.invalidateQueries({ queryKey: ['public-post'] }),
    ])
  }
  const create = useMutation({ mutationFn: managerPostApi.create, onSuccess: refresh })
  const update = useMutation({ mutationFn: ({ id, input }: { id: number; input: Parameters<typeof managerPostApi.update>[1] }) => managerPostApi.update(id, input), onSuccess: refresh })
  const remove = useMutation({ mutationFn: managerPostApi.delete, onSuccess: refresh })
  const review = useMutation({ mutationFn: ({ id, decision }: { id: number; decision: 'APPROVE' | 'REJECT' }) => managerPostApi.review(id, decision), onSuccess: refresh })
  return { create, update, remove, review }
}
