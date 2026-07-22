import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  emailSequencesApi,
  type EmailSequenceCreateRequest,
  type EnrollRequest,
} from '../services/emailSequencesApi'

export function useEmailSequences() {
  return useQuery({
    queryKey: ['crm', 'email-sequences'],
    queryFn: () => emailSequencesApi.list(),
  })
}

export function useCreateEmailSequence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EmailSequenceCreateRequest) =>
      emailSequencesApi.create(body),
    onSuccess: () => {
      toast.success('Đã tạo sequence')
      qc.invalidateQueries({ queryKey: ['crm', 'email-sequences'] })
    },
    onError: () => toast.error('Tạo sequence thất bại'),
  })
}

export function useEnrollEmailSequence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sequenceId,
      body,
    }: {
      sequenceId: string
      body: EnrollRequest
    }) => emailSequencesApi.enroll(sequenceId, body),
    onSuccess: () => {
      toast.success('Đã enroll lead')
      qc.invalidateQueries({ queryKey: ['crm', 'email-sequences'] })
    },
    onError: () => toast.error('Enroll thất bại'),
  })
}
