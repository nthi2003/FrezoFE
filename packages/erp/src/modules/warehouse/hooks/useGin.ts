import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ginApi,
  type GinConfirmRequest,
  type GinCreateRequest,
} from '../services/ginApi'

export function useGins(params?: { status?: string; keyword?: string }) {
  return useQuery({
    queryKey: ['warehouse', 'gin', params],
    queryFn: () => ginApi.list(params),
  })
}

export function useGin(id?: string) {
  return useQuery({
    queryKey: ['warehouse', 'gin', id],
    queryFn: () => ginApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateGin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: GinCreateRequest) => ginApi.create(body),
    onSuccess: (gin) => {
      toast.success(`Đã tạo phiếu xuất ${gin?.ginCode || gin?.id || ''}`)
      qc.invalidateQueries({ queryKey: ['warehouse', 'gin'] })
    },
    onError: () => toast.error('Tạo phiếu xuất kho thất bại'),
  })
}

export function useSubmitGin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ginApi.submit(id),
    onSuccess: () => {
      toast.success('Đã gửi duyệt phiếu xuất kho')
      qc.invalidateQueries({ queryKey: ['warehouse', 'gin'] })
    },
    onError: () => toast.error('Gửi duyệt thất bại'),
  })
}

export function useApproveGin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ginApi.approve(id),
    onSuccess: () => {
      toast.success('Đã duyệt phiếu xuất kho')
      qc.invalidateQueries({ queryKey: ['warehouse', 'gin'] })
    },
    onError: () => toast.error('Duyệt phiếu thất bại'),
  })
}

export function useConfirmGin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: GinConfirmRequest }) =>
      ginApi.confirm(id, body),
    onSuccess: () => {
      toast.success('Đã xác nhận xuất kho — tồn kho đã cập nhật')
      qc.invalidateQueries({ queryKey: ['warehouse', 'gin'] })
    },
    onError: () => toast.error('Xác nhận xuất kho thất bại'),
  })
}

export function useCancelGin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      ginApi.cancel(id, reason),
    onSuccess: () => {
      toast.success('Đã huỷ phiếu xuất kho')
      qc.invalidateQueries({ queryKey: ['warehouse', 'gin'] })
    },
    onError: () => toast.error('Huỷ phiếu xuất kho thất bại'),
  })
}

export function usePrintGin() {
  return useMutation({
    mutationFn: (id: string) => ginApi.printHtml(id),
    onSuccess: (html) => {
      const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200')
      if (!w) {
        toast.error('Trình duyệt chặn popup — cho phép mở cửa sổ in')
        return
      }
      w.document.open()
      w.document.write(html)
      w.document.close()
      w.focus()
      setTimeout(() => w.print(), 300)
    },
    onError: () => toast.error('Không tải được bản in phiếu xuất'),
  })
}
