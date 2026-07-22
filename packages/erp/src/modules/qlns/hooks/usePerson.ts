import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unwrapList } from '@frezo/utils'
import { personApi } from '../services/personApi'
import { toast } from 'sonner'

export function usePersons(params?: any) {
  return useQuery({
    queryKey: params ? ['persons', params] : ['persons'],
    queryFn: () => personApi.getAll(params),
    select: (res: any) => res?.data ?? { items: [], total: 0 },
  })
}

/**
 * Combobox nhân viên — trả về mảng `{ value, label, ... }` đã unwrap.
 * BE trả `ApiResponse<[...]>`; hook này chuẩn hoá cả 3 shape (array trần / Page / items).
 */
export function usePersonCombobox(params?: any) {
  return useQuery({
    queryKey: ['persons_combobox', params],
    queryFn: () => personApi.getCombobox(params),
    select: unwrapList,
  })
}

/**
 * Alias tiếng Anh + mapping sẵn ra `{ value, label }` — dùng cho các form/modal
 * cần dropdown chuẩn Select. Giá trị fallback cho cả `id` và `code` để tương thích với
 * mọi endpoint combobox (một số BE trả `{value, label}`, số khác trả `{id, name}`).
 */
export function usePersonsCombobox(params?: any) {
  const q = usePersonCombobox(params)
  return {
    ...q,
    options: (q.data ?? []).map((p: any) => ({
      value: p.value ?? p.id ?? p.code ?? '',
      label: p.label ?? p.name ?? p.fullName ?? p.value ?? '',
      raw: p,
    })),
  }
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
