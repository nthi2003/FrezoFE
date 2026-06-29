// ============================================================
// FREZO ERP — useRoles Hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roleApi, type RoleRequest } from '../services/roleApi'
import { toast } from 'sonner'

export function useRoles(appCode?: string) {
  return useQuery({
    queryKey: ['roles', { appCode }],
    queryFn: () => roleApi.getRoles(appCode),
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RoleRequest) => roleApi.createRole(data),
    onSuccess: () => {
      toast.success('Thêm mới vai trò thành công')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi khi thêm vai trò')
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RoleRequest) => roleApi.updateRole(data),
    onSuccess: () => {
      toast.success('Cập nhật vai trò thành công')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật vai trò')
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ code, appCode }: { code: string; appCode: string }) =>
      roleApi.deleteRole(code, appCode),
    onSuccess: () => {
      toast.success('Xóa vai trò thành công')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi khi xóa vai trò')
    },
  })
}
