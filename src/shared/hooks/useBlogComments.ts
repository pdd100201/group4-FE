import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blogApi, type CommentAuthorRole } from '../../features/blog/api/blogApi'
import { useAuth } from '../context/AuthContext'

export function useBlogComments(postId: number, page: number) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['post-comments', postId, page, user?.email ?? 'guest'], queryFn: () => blogApi.comments(postId, page) })
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
  }
  const create = useMutation({ mutationFn: ({ content, role }: { content: string; role: CommentAuthorRole }) => blogApi.createComment(postId, content, role), onSuccess: refresh })
  const edit = useMutation({ mutationFn: ({ id, content, role }: { id: number; content: string; role: CommentAuthorRole }) => blogApi.editComment(id, content, role), onSuccess: refresh })
  const remove = useMutation({ mutationFn: blogApi.deleteComment, onSuccess: refresh })
  return { create, edit, remove }
}
