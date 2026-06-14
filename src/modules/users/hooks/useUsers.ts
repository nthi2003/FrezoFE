// ============================================================
// FREZO ERP — useUsers Hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi, type RegisterRequest, type UserDTO } from '../services/userApi'
import { toast } from 'sonner'

export function useUsers(page: number, size: number, search: string = '') {
  return useQuery({
    queryKey: ['users', { page, size, search }],
    queryFn: () => userApi.getUsers(page, size, search),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RegisterRequest) => userApi.createUser(data),
    onSuccess: () => {
      toast.success('Thêm mới người dùng thành công')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi khi thêm người dùng')
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<UserDTO> }) => userApi.updateUser(id, data),
    onSuccess: () => {
      toast.success('Cập nhật người dùng thành công')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi cập nhật')
    },
  })
}

export function useActiveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => userApi.activeUser(id),
    onSuccess: () => {
      toast.success('Kích hoạt tài khoản thành công')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi mở khóa')
    },
  })
}

export function useLockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => userApi.lockUser(id),
    onSuccess: () => {
      toast.success('Đã khóa tài khoản')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string | number) => userApi.resetPassword(id),
    onSuccess: (newPass) => {
      toast.success('Mật khẩu mới: ' + newPass, { duration: 10000 })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi reset mật khẩu')
    },
  })
}

export function useAssignRole() {
  return useMutation({
    mutationFn: ({ username, roleCode, appCode }: { username: string; roleCode: string; appCode?: string }) =>
      userApi.assignRole(username, roleCode, appCode),
    onSuccess: () => {
      toast.success('Gán vai trò thành công')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Lỗi gán vai trò')
    },
  })
}
