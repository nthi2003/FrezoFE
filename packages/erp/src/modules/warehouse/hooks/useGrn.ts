import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  grnApi,
  type GrnConfirmRequest,
  type GrnCreateRequest,
} from '../services/grnApi'

export function useGrns(params?: { status?: string; keyword?: string }) {
  return useQuery({
    queryKey: ['warehouse', 'grn', params],
    queryFn: () => grnApi.list(params),
  })
}

export function useGrn(id?: string) {
  return useQuery({
    queryKey: ['warehouse', 'grn', id],
    queryFn: () => grnApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateGrn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: GrnCreateRequest) => grnApi.create(body),
    onSuccess: (grn) => {
      toast.success(`Đã tạo PNK ${grn?.grnCode || grn?.id || ''}`)
      qc.invalidateQueries({ queryKey: ['warehouse', 'grn'] })
    },
    onError: () => toast.error('Tạo phiếu nhập kho thất bại'),
  })
}

export function useConfirmGrn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: GrnConfirmRequest }) =>
      grnApi.confirm(id, body),
    onSuccess: () => {
      toast.success('Đã xác nhận nhập kho — tồn kho đã cập nhật')
      qc.invalidateQueries({ queryKey: ['warehouse', 'grn'] })
      qc.invalidateQueries({ queryKey: ['warehouse', 'purchase-orders'] })
    },
    onError: () => toast.error('Xác nhận nhập kho thất bại'),
  })
}

export function useCancelGrn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      grnApi.cancel(id, reason),
    onSuccess: () => {
      toast.success('Đã huỷ phiếu nhập kho')
      qc.invalidateQueries({ queryKey: ['warehouse', 'grn'] })
    },
    onError: () => toast.error('Huỷ phiếu nhập kho thất bại'),
  })
}

export function usePrintGrn() {
  return useMutation({
    mutationFn: (id: string) => grnApi.printHtml(id),
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
    onError: () => toast.error('Không tải được bản in PNK'),
  })
}
