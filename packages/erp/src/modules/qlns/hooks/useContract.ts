import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractApi } from '../services/contractApi'
import { toast } from 'sonner'

export function useContractVersions(contractId: string) {
  return useQuery({
    queryKey: ['contract_versions', contractId],
    queryFn: () => contractApi.getVersions(contractId),
    enabled: !!contractId
  })
}

export function useContractVersionsDiff(contractId: string) {
  return useQuery({
    queryKey: ['contract_versions_diff', contractId],
    queryFn: () => contractApi.getVersionsDiff(contractId),
    enabled: !!contractId
  })
}

export function useRejectContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => contractApi.reject(id, data),
    onSuccess: () => {
      toast.success('Đã từ chối hợp đồng')
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Có lỗi xảy ra'),
  })
}
