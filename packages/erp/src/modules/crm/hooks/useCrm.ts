import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unwrapList, unwrapOne } from '@frezo/utils'
import { toast } from 'sonner'
import {
  leadsApi, pipelinesApi, dealsApi, activitiesApi, quotesApi, invoicesApi,
  type LeadStatus, type LeadRequest, type DealStatus, type DealRequest,
  type DealActivity, type QuoteRequest, type QuoteStatus,
  type InvoiceRequest, type InvoiceStatus,
} from '../services/crmApi'

const one = unwrapOne
const list = unwrapList

// ---- Leads ----
export function useLeads(status?: LeadStatus, owner?: string) {
  return useQuery({
    queryKey: ['crm', 'leads', status ?? 'all', owner ?? 'all'],
    queryFn: () => leadsApi.list({ status, owner }),
    select: list,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LeadRequest) => leadsApi.create(data),
    onSuccess: () => {
      toast.success('Đã thêm lead')
      qc.invalidateQueries({ queryKey: ['crm', 'leads'] })
    },
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeadRequest }) => leadsApi.update(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật lead')
      qc.invalidateQueries({ queryKey: ['crm', 'leads'] })
    },
  })
}

export function useConvertLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pipelineId }: { id: string; pipelineId?: string }) =>
      leadsApi.convert(id, pipelineId),
    onSuccess: () => {
      toast.success('Đã chuyển khách tiềm năng thành cơ hội bán')
      qc.invalidateQueries({ queryKey: ['crm'] })
    },
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'leads'] })
    },
    onError: () => toast.error('Xoá lead thất bại'),
  })
}

// ---- Pipelines ----
export function usePipelines(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['crm', 'pipelines'],
    queryFn: () => pipelinesApi.list(),
    select: list,
    enabled: options?.enabled ?? true,
  })
}

export function usePipelineStages(pipelineId?: string) {
  return useQuery({
    queryKey: ['crm', 'pipelines', pipelineId, 'stages'],
    queryFn: () => pipelinesApi.stages(pipelineId!),
    select: list,
    enabled: !!pipelineId,
  })
}

export function useEnsureDefaultPipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => pipelinesApi.ensureDefault(),
    onSuccess: () => {
      toast.success('Đã tạo phễu bán hàng mặc định')
      qc.invalidateQueries({ queryKey: ['crm', 'pipelines'] })
    },
  })
}

export function useReorderPipelineStages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Parameters<typeof pipelinesApi.update>[1]
    }) => pipelinesApi.update(id, data),
    onSuccess: (_res, vars) => {
      toast.success('Đã đổi thứ tự cột phễu bán hàng')
      qc.invalidateQueries({ queryKey: ['crm', 'pipelines', vars.id, 'stages'] })
      qc.invalidateQueries({ queryKey: ['crm', 'pipelines'] })
    },
    onError: () => toast.error('Đổi thứ tự cột thất bại'),
  })
}

// ---- Deals ----
export function useDealsByPipeline(pipelineId?: string, status?: DealStatus) {
  return useQuery({
    queryKey: ['crm', 'deals', 'pipeline', pipelineId, status ?? 'all'],
    queryFn: () => dealsApi.listByPipeline(pipelineId!, status),
    select: list,
    enabled: !!pipelineId,
  })
}

export function useDealDetail(id?: string) {
  return useQuery({
    queryKey: ['crm', 'deals', id],
    queryFn: () => dealsApi.get(id!),
    select: one,
    enabled: !!id,
  })
}

export function useCreateDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: DealRequest) => dealsApi.create(data),
    onSuccess: () => {
      toast.success('Đã tạo cơ hội bán')
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] })
    },
  })
}

export function useMoveDealStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) => dealsApi.moveToStage(id, stageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] })
    },
  })
}

export function useMarkDealWon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dealsApi.markWon(id),
    onSuccess: () => {
      toast.success('Đã chốt cơ hội bán')
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] })
    },
  })
}

export function useMarkDealLost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => dealsApi.markLost(id, reason),
    onSuccess: () => {
      toast.success('Đã đánh dấu cơ hội thất bại')
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] })
    },
  })
}

// ---- Activities ----
export function useDealActivities(dealId?: string) {
  return useQuery({
    queryKey: ['crm', 'activities', 'deal', dealId],
    queryFn: () => activitiesApi.listByDeal(dealId!),
    select: list,
    enabled: !!dealId,
  })
}

export function useCreateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<DealActivity>) => activitiesApi.create(data),
    onSuccess: (_, vars) => {
      if (vars.dealId) {
        qc.invalidateQueries({ queryKey: ['crm', 'activities', 'deal', vars.dealId] })
      }
    },
  })
}

// ---- Quotes ----
export function useQuotes() {
  return useQuery({
    queryKey: ['crm', 'quotes'],
    queryFn: () => quotesApi.list(),
    select: list,
  })
}

export function useQuoteDetail(id?: string) {
  return useQuery({
    queryKey: ['crm', 'quotes', id, 'full'],
    queryFn: () => quotesApi.getWithItems(id!),
    select: one,
    enabled: !!id,
  })
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: QuoteRequest) => quotesApi.create(data),
    onSuccess: () => {
      toast.success('Đã tạo báo giá')
      qc.invalidateQueries({ queryKey: ['crm', 'quotes'] })
    },
  })
}

export function useSetQuoteStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteStatus }) =>
      quotesApi.setStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'quotes'] })
    },
  })
}

// ---- Invoices ----
export function useInvoices(status?: InvoiceStatus) {
  return useQuery({
    queryKey: ['crm', 'invoices', status ?? 'all'],
    queryFn: () => invoicesApi.list(status),
    select: list,
  })
}

export function useInvoiceDetail(id?: string) {
  return useQuery({
    queryKey: ['crm', 'invoices', id, 'full'],
    queryFn: () => invoicesApi.getWithItems(id!),
    select: one,
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InvoiceRequest) => invoicesApi.create(data),
    onSuccess: () => {
      toast.success('Đã tạo hoá đơn')
      qc.invalidateQueries({ queryKey: ['crm', 'invoices'] })
    },
  })
}

export function useIssueInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoicesApi.issue(id),
    onSuccess: () => {
      toast.success('Đã phát hành hoá đơn')
      qc.invalidateQueries({ queryKey: ['crm', 'invoices'] })
    },
  })
}

export function usePostInvoiceToGL() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoicesApi.postToGL(id),
    onSuccess: () => {
      toast.success('Đã hạch toán vào sổ cái')
      qc.invalidateQueries({ queryKey: ['crm', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['accounting'] })
    },
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note?: string }) =>
      invoicesApi.recordPayment(id, amount, note),
    onSuccess: () => {
      toast.success('Đã ghi nhận thanh toán')
      qc.invalidateQueries({ queryKey: ['crm', 'invoices'] })
    },
  })
}
