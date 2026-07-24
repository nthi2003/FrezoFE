import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { commentApi } from './commentApi'
import type { CommentCreatePayload, CommentUpdatePayload } from './types'

function invalidateSubject(qc: ReturnType<typeof useQueryClient>, subjectType: string, subjectId: string) {
  qc.invalidateQueries({ queryKey: ['comments', subjectType, subjectId] })
  // Board card commentCount / attachmentCount — sync sau create/delete
  if (subjectType === 'TICKET') {
    qc.invalidateQueries({ queryKey: ['tickets'] })
  }
}

export function useComments(subjectType: string, subjectId?: string) {
  return useQuery({
    queryKey: ['comments', subjectType, subjectId],
    queryFn: () =>
      commentApi.list({ subjectType, subjectId: subjectId!, page: 0, size: 200 }),
    enabled: !!subjectType && !!subjectId,
    select: (page) => page?.content ?? [],
    // Polling 15s — WS topic /topic/comments/{type}/{id} chưa consume
    refetchInterval: 15_000,
  })
}

export function useCreateComment(subjectType: string, subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<CommentCreatePayload, 'subjectType' | 'subjectId'>) =>
      commentApi.create({ ...payload, subjectType, subjectId }),
    onSuccess: () => {
      invalidateSubject(qc, subjectType, subjectId)
    },
    onError: () => toast.error('Gửi bình luận thất bại'),
  })
}

export function useUpdateComment(subjectType: string, subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: CommentUpdatePayload & { id: string }) =>
      commentApi.update(id, payload),
    onSuccess: () => {
      toast.success('Đã sửa bình luận')
      invalidateSubject(qc, subjectType, subjectId)
    },
    onError: () => toast.error('Sửa bình luận thất bại'),
  })
}

export function useDeleteComment(subjectType: string, subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => commentApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá bình luận')
      invalidateSubject(qc, subjectType, subjectId)
    },
    onError: () => toast.error('Xoá bình luận thất bại'),
  })
}

export function useMentionUsers(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ['user-search', query],
    queryFn: () => commentApi.searchUsers(query),
    enabled: enabled && query.length >= 0,
    staleTime: 30_000,
  })
}

export function useUploadCommentAttachment() {
  return useMutation({
    mutationFn: (file: File) => commentApi.uploadAttachment(file),
    onError: () => toast.error('Tải file đính kèm thất bại'),
  })
}
