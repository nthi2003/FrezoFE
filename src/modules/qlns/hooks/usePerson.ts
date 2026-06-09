import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personApi } from '../services/personApi'
import { toast } from 'sonner'

export function usePersons(params?: any) {
  return useQuery({
    queryKey: ['persons', params],
    queryFn: () => personApi.getAll(params),
  })
}

export function usePersonCombobox(params?: any) {
  return useQuery({
    queryKey: ['persons_combobox', params],
    queryFn: () => personApi.getCombobox(params),
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => personApi.create(data),
    onSuccess: () => {
      toast.success('Thêm nhân viên thành công')
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Có lỗi xảy ra'),
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => personApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật thành công')
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Có lỗi xảy ra'),
  })
}

export function useActivatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => personApi.activate(id),
    onSuccess: () => {
      toast.success('Kích hoạt thành công')
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}

export function useDeactivatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => personApi.deactivate(id),
    onSuccess: () => {
      toast.success('Vô hiệu hóa thành công')
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => personApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa thành công')
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}
