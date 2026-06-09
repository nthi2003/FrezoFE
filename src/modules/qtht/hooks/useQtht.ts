import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentApi, organizationApi, permissionApi } from '../services/qthtApi'
import { toast } from 'sonner'

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll(),
  })
}
export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => departmentApi.create(data),
    onSuccess: () => { toast.success('Tạo thành công'); queryClient.invalidateQueries({ queryKey: ['departments'] }) },
  })
}
export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => departmentApi.update(id, data),
    onSuccess: () => { toast.success('Cập nhật thành công'); queryClient.invalidateQueries({ queryKey: ['departments'] }) },
  })
}
export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => departmentApi.delete(id),
    onSuccess: () => { toast.success('Xóa thành công'); queryClient.invalidateQueries({ queryKey: ['departments'] }) },
  })
}

// Organzation
export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(),
  })
}
export function useCreateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => organizationApi.create(data),
    onSuccess: () => { toast.success('Tạo thành công'); queryClient.invalidateQueries({ queryKey: ['organizations'] }) },
  })
}
export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => organizationApi.update(id, data),
    onSuccess: () => { toast.success('Cập nhật thành công'); queryClient.invalidateQueries({ queryKey: ['organizations'] }) },
  })
}
export function useDeleteOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => organizationApi.delete(id),
    onSuccess: () => { toast.success('Xóa thành công'); queryClient.invalidateQueries({ queryKey: ['organizations'] }) },
  })
}

// Permission
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionApi.getAll(),
  })
}
export function useCreatePermission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => permissionApi.create(data),
    onSuccess: () => { toast.success('Tạo thành công'); queryClient.invalidateQueries({ queryKey: ['permissions'] }) },
  })
}
export function useDeletePermission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => permissionApi.delete(id),
    onSuccess: () => { toast.success('Xóa thành công'); queryClient.invalidateQueries({ queryKey: ['permissions'] }) },
  })
}
