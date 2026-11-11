import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blogApi } from '../../features/blog/api/blogApi'
import { useAuth } from '../context/AuthContext'

export function useBlogComments(postId: number, page: number) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['post-comments', postId, page, user?.email ?? 'guest'], queryFn: () => blogApi.comments(postId, page) })
}
export function useBlogReplies(postId: number, id: number, page: number, enabled: boolean) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['post-comment-replies', postId, id, page, user?.email ?? 'guest'], queryFn: () => blogApi.replies(postId, id, page), enabled })
}
export function useCommentDetail(postId: number, id: number | null) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['post-comment', postId, id, user?.email ?? 'guest'], queryFn: () => blogApi.comment(postId, id!), enabled: id !== null })
}
export function useCommentActions(postId: number) {
  const client = useQueryClient()
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['post-comments', postId] })
    await client.invalidateQueries({ queryKey: ['post-comment', postId] })
    await client.invalidateQueries({ queryKey: ['post-comment-replies', postId] })
  }
  const create = useMutation({ mutationFn: (content: string) => blogApi.createComment(postId, content), onSuccess: refresh })
  const edit = useMutation({ mutationFn: ({ id, content }: { id: number; content: string }) => blogApi.editComment(id, content), onSuccess: refresh })
  const remove = useMutation({ mutationFn: blogApi.deleteComment, onSuccess: refresh })
  const like = useMutation({ mutationFn: blogApi.likeComment, onSuccess: refresh })
  const reply = useMutation({ mutationFn: ({ id, content }: { id: number; content: string }) => blogApi.reply(postId, id, content), onSuccess: refresh })
  return { create, edit, remove, like, reply }
}
