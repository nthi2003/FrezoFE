import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contractSignApi } from '../services/contractSignApi'

export function useContractSignStatus(contractId?: string) {
  return useQuery({
    queryKey: ['contracts', 'sign-status', contractId],
    queryFn: () => contractSignApi.status(contractId!),
    enabled: !!contractId,
  })
}

export function useRequestSignOtp() {
  return useMutation({
    mutationFn: (contractId: string) => contractSignApi.requestOtp(contractId),
    onSuccess: (res) => {
      const exp = res?.expiresAt
        ? new Date(res.expiresAt).toLocaleString('vi-VN')
        : '—'
      toast.success(
        `OTP đã gửi · session ${res?.sessionId?.slice(0, 8) || '—'}… · hết hạn ${exp}`,
      )
    },
    onError: () => toast.error('Gửi OTP thất bại'),
  })
}

export function useConfirmSignOtp(contractId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (otp: string) => contractSignApi.confirm(contractId, otp),
    onSuccess: (res) => {
      toast.success(
        `Ký thành công (${res?.status || 'SIGNED'}) · ${res?.signedBy || ''}`,
      )
      qc.invalidateQueries({ queryKey: ['contracts', 'sign-status', contractId] })
    },
    onError: () => toast.error('OTP không hợp lệ hoặc đã hết hạn'),
  })
}
