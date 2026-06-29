import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apilogApi } from '../services/apilogApi'
import { toast } from 'sonner'

export function useApiLogs(page: number = 1, size: number = 10) {
  return useQuery({
    queryKey: ['apilogs', { pageNumber: page - 1, pageSize: size }],
    queryFn: () => apilogApi.getLogs({ pageNumber: page - 1, pageSize: size }),
    select: (data) => ({
      items: data.items ?? [],
      total: data.total ?? 0,
      current: data.current ?? page,
      pageSize: data.pageSize ?? size,
    }),
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
