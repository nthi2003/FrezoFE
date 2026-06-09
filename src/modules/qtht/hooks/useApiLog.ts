import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apilogApi } from '../services/apilogApi'
import { toast } from 'sonner'

export function useApiLogs() {
  return useQuery({
    queryKey: ['apilogs'],
    queryFn: apilogApi.getLogs,
    initialData: [],
  })
}

export function useDeleteApiLogs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: apilogApi.deleteBulk,
    onSuccess: (msg) => {
      toast.success(msg || 'Đã dọn dẹp Log thành công')
      qc.invalidateQueries({ queryKey: ['apilogs'] })
    },
    onError: () => toast.error('Lỗi khi xóa Logs')
  })
}
