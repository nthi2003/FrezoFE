import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingApi } from '../services/settingApi'
import { toast } from 'sonner'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingApi.getSettings,
    initialData: [],
  })
}

export function useUpdateSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, value }: { id: string, value: string }) => settingApi.updateSetting(id, value),
    onSuccess: () => {
      toast.success('Lưu cài đặt thành công')
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: () => toast.error('Lỗi khi lưu cài đặt')
  })
}

export function useBackupSystem() {
  return useMutation({
    mutationFn: settingApi.backupSystem,
    onSuccess: (msg) => toast.success(msg || 'Đã gửi yêu cầu Backup Database thành công'),
    onError: () => toast.error('Lỗi khi sao lưu hệ thống')
  })
}
