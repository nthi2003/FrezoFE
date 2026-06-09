import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roleMenuApi } from '../services/roleMenuApi'
import { toast } from 'sonner'

export function useRoleMenus(roleCode?: string) {
  return useQuery({
    queryKey: ['role_menus', roleCode],
    queryFn: () => roleMenuApi.getMenusByRole(roleCode!),
    enabled: !!roleCode,
    initialData: [],
  })
}

export function useSaveRoleMenus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: roleMenuApi.saveAll,
    onSuccess: () => {
      toast.success('Lưu phân quyền Menu thành công')
      qc.invalidateQueries({ queryKey: ['role_menus'] })
    },
    onError: () => toast.error('Lỗi khi lưu phân quyền Menu')
  })
}
