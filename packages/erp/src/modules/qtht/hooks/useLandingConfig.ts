import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { landingApi } from '../services/landingApi'
import { toast } from 'sonner'

export function useLandingConfig() {
  return useQuery({
    queryKey: ['landing_config'],
    queryFn: landingApi.getConfig,
  })
}

export function useUpdateLandingConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: landingApi.updateConfig,
    onSuccess: () => {
      toast.success('Lưu cấu hình Landing Page thành công')
      qc.invalidateQueries({ queryKey: ['landing_config'] })
    },
    onError: () => toast.error('Lỗi khi lưu cấu hình Landing Page')
  })
}
