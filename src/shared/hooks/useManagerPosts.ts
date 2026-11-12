import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminPostApi, managerPostApi } from '../../features/management/api/managerPostApi'

import { useAuth } from '../context/AuthContext'

export function usePostManagement() {
  const { user } = useAuth()
  const admin = Boolean(user?.roles.includes('ROLE_ADMIN'))
  return { api: admin ? adminPostApi : managerPostApi, postsPath: admin ? '/admin/posts' : '/manager/posts', userId: user?.id }
}

export function useManagerPosts(page: number, size = 10) {
  const { api, userId } = usePostManagement()
  return useQuery({ queryKey: ['manager-posts', userId, page, size], queryFn: () => api.list(page, size) })
}

export function useManagerPostActions() {
  const { api } = usePostManagement()
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
  const create = useMutation({ mutationFn: api.create, onSuccess: refresh })
  const update = useMutation({ mutationFn: ({ id, input }: { id: number; input: Parameters<typeof api.update>[1] }) => api.update(id, input), onSuccess: refresh })
  const remove = useMutation({ mutationFn: api.delete, onSuccess: refresh })
  const review = useMutation({ mutationFn: ({ id, decision }: { id: number; decision: 'APPROVE' | 'REJECT' }) => api.review(id, decision), onSuccess: refresh })
  return { create, update, remove, review }
}
