import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productApi } from '../services/productApi'
import { toast } from 'sonner'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll(),
    select: (res: any) => res?.data ?? [],
  })
}

export function useProductById(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => productApi.create(data),
    onSuccess: () => {
      toast.success('Thêm sản phẩm thành công')
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => toast.error('Lỗi khi thêm sản phẩm'),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật sản phẩm thành công')
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => toast.error('Lỗi khi cập nhật sản phẩm'),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa sản phẩm thành công')
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => toast.error('Lỗi khi xóa sản phẩm'),
  })
}
