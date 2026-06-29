import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingApi } from '../services/settingApi'
import { organizationApi } from '../services/qthtApi'
import { toast } from 'sonner'

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getCombobox(),
    select: (res: any) => {
      if (Array.isArray(res)) return res
      return res?.data ?? []
    },
  })
}

export function useSettingByOrg(orgId: string | null) {
  return useQuery({
    queryKey: ['setting_by_org', orgId],
    queryFn: () => settingApi.getByOrgId(orgId!),
    enabled: !!orgId,
    select: (res: any) => {
      if (res?.data) return res.data
      return res
    },
  })
}

export function useUpdateOrgSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => settingApi.updateSetting(id, data),
    onSuccess: () => {
      toast.success('Lưu cài đặt thành công')
      queryClient.invalidateQueries({ queryKey: ['setting_by_org'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Có lỗi xảy ra'),
  })
}

export function useCreateOrgSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => settingApi.createSetting(data),
    onSuccess: () => {
      toast.success('Tạo cài đặt thành công')
      queryClient.invalidateQueries({ queryKey: ['setting_by_org'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Có lỗi xảy ra'),
  })
}
