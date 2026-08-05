import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

// -------- Leads --------
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED'

export interface Lead {
  id: string
  fullName: string
  phone?: string
  email?: string
  companyName?: string
  source?: string
  status: LeadStatus
  score?: number
  ownerUsername?: string
  convertedCustomerId?: string
  convertedDealId?: string
  description?: string
  createdDate?: string
}

export interface LeadRequest extends Omit<Partial<Lead>, 'id' | 'status'> {
  status?: LeadStatus
}

export const leadsApi = {
  list: (params?: { status?: LeadStatus; owner?: string }) =>
    axiosClient.get<ApiResponse<Lead[]>>('/crm/leads', { params }).then((r) => r.data),
  get: (id: string) =>
    axiosClient.get<ApiResponse<Lead>>(`/crm/leads/${id}`).then((r) => r.data),
  create: (data: LeadRequest) =>
    axiosClient.post<ApiResponse<Lead>>('/crm/leads', data).then((r) => r.data),
  update: (id: string, data: LeadRequest) =>
    axiosClient.put<ApiResponse<Lead>>(`/crm/leads/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/crm/leads/${id}`).then((r) => r.data),
  convert: (id: string, pipelineId?: string) =>
    axiosClient
      .post<ApiResponse<Deal>>(`/crm/leads/${id}/convert`, null, {
        params: pipelineId ? { pipelineId } : {},
      })
      .then((r) => r.data),
}

// -------- Pipelines & Stages --------
export interface Stage {
  id: string
  pipelineId: string
  name: string
  orderNo: number
  probability?: number
  won?: boolean
}

export interface Pipeline {
  id: string
  name: string
  description?: string
  isDefault?: boolean
  active?: boolean
  stages?: Stage[]
}

export type PipelineUpsert = Partial<Pipeline> & {
  name: string
  stages?: Array<Partial<Stage> & { name: string }>
}

export const pipelinesApi = {
  list: () =>
    axiosClient.get<ApiResponse<Pipeline[]>>('/crm/pipelines').then((r) => r.data),
  get: (id: string) =>
    axiosClient.get<ApiResponse<Pipeline>>(`/crm/pipelines/${id}`).then((r) => r.data),
  stages: (id: string) =>
    axiosClient.get<ApiResponse<Stage[]>>(`/crm/pipelines/${id}/stages`).then((r) => r.data),
  ensureDefault: () =>
    axiosClient.post<ApiResponse<Pipeline>>('/crm/pipelines/ensure-default').then((r) => r.data),
  create: (data: PipelineUpsert) =>
    axiosClient.post<ApiResponse<Pipeline>>('/crm/pipelines', data).then((r) => r.data),
  update: (id: string, data: PipelineUpsert) =>
    axiosClient.put<ApiResponse<Pipeline>>(`/crm/pipelines/${id}`, data).then((r) => r.data),
}

// -------- Deals --------
export type DealStatus = 'OPEN' | 'WON' | 'LOST' | 'STALLED'

export interface Deal {
  id: string
  title: string
  pipelineId: string
  stageId: string
  customerId?: string
  customerName?: string
  amount: number
  currency?: string
  probability?: number
  expectedCloseDate?: string
  closedDate?: string
  status: DealStatus
  ownerUsername?: string
  description?: string
  lostReason?: string
  createdDate?: string
}

export interface DealRequest extends Omit<Partial<Deal>, 'id'> {}

export const dealsApi = {
  listByPipeline: (pipelineId: string, status?: DealStatus) =>
    axiosClient
      .get<ApiResponse<Deal[]>>('/crm/deals', { params: { pipelineId, status } })
      .then((r) => r.data),
  listByOwner: (ownerUsername: string) =>
    axiosClient
      // BE DealController: @RequestParam("owner")
      .get<ApiResponse<Deal[]>>('/crm/deals', { params: { owner: ownerUsername } })
      .then((r) => r.data),
  listByCustomer: (customerId: string) =>
    axiosClient
      .get<ApiResponse<Deal[]>>('/crm/deals', { params: { customerId } })
      .then((r) => r.data),
  get: (id: string) =>
    axiosClient.get<ApiResponse<Deal>>(`/crm/deals/${id}`).then((r) => r.data),
  create: (data: DealRequest) =>
    axiosClient.post<ApiResponse<Deal>>('/crm/deals', data).then((r) => r.data),
  update: (id: string, data: DealRequest) =>
    axiosClient.put<ApiResponse<Deal>>(`/crm/deals/${id}`, data).then((r) => r.data),
  /** BE: PATCH /crm/deals/{id}/move-stage?toStageId=… — luôn theo deal id của thẻ đó. */
  moveToStage: (id: string, stageId: string) =>
    axiosClient
      .patch<ApiResponse<Deal>>(`/crm/deals/${id}/move-stage`, null, {
        params: { toStageId: stageId },
      })
      .then((r) => r.data),
  markWon: (id: string) =>
    axiosClient.patch<ApiResponse<Deal>>(`/crm/deals/${id}/won`).then((r) => r.data),
  markLost: (id: string, reason?: string) =>
    axiosClient
      .patch<ApiResponse<Deal>>(`/crm/deals/${id}/lost`, null, {
        params: reason ? { reason } : {},
      })
      .then((r) => r.data),
}

// -------- Activities --------
export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK'

export interface DealActivity {
  id: string
  dealId?: string
  customerId?: string
  activityType: ActivityType
  subject: string
  content?: string
  happenedAt?: string
  ownerUsername?: string
  createdDate?: string
}

export const activitiesApi = {
  listByDeal: (dealId: string) =>
    axiosClient
      .get<ApiResponse<DealActivity[]>>('/crm/activities', { params: { dealId } })
      .then((r) => r.data),
  listByCustomer: (customerId: string) =>
    axiosClient
      .get<ApiResponse<DealActivity[]>>('/crm/activities', { params: { customerId } })
      .then((r) => r.data),
  create: (data: Partial<DealActivity>) =>
    axiosClient.post<ApiResponse<DealActivity>>('/crm/activities', data).then((r) => r.data),
}

// -------- Quotes --------
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export interface QuoteItem {
  id?: string
  quoteId?: string
  productCode?: string
  productName: string
  quantity: number
  unit?: string
  unitPrice: number
  taxRate?: number
  discountPct?: number
  lineTotal?: number
}

export interface Quote {
  id: string
  code: string
  dealId?: string
  customerId?: string
  customerName?: string
  issuedDate?: string
  validUntil?: string
  currency?: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  status: QuoteStatus
  notes?: string
  items?: QuoteItem[]
}

export interface QuoteRequest extends Omit<Partial<Quote>, 'id'> {
  items?: QuoteItem[]
}

export const quotesApi = {
  list: () => axiosClient.get<ApiResponse<Quote[]>>('/crm/quotes').then((r) => r.data),
  getWithItems: (id: string) =>
    axiosClient.get<ApiResponse<Quote>>(`/crm/quotes/${id}/full`).then((r) => r.data),
  create: (data: QuoteRequest) =>
    axiosClient.post<ApiResponse<Quote>>('/crm/quotes', data).then((r) => r.data),
  update: (id: string, data: QuoteRequest) =>
    axiosClient.put<ApiResponse<Quote>>(`/crm/quotes/${id}`, data).then((r) => r.data),
  setStatus: (id: string, status: QuoteStatus) =>
    axiosClient
      .post<ApiResponse<Quote>>(`/crm/quotes/${id}/status`, null, { params: { status } })
      .then((r) => r.data),
}

// -------- Invoices --------
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'

export interface InvoiceItem {
  id?: string
  invoiceId?: string
  productCode?: string
  productName: string
  quantity: number
  unit?: string
  unitPrice: number
  taxRate?: number
  discountPct?: number
  lineTotal?: number
}

export interface Invoice {
  id: string
  code: string
  customerId?: string
  customerName?: string
  quoteId?: string
  issuedDate?: string
  dueDate?: string
  currency?: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  paidAmount: number
  status: InvoiceStatus
  glJournalEntryId?: string
  notes?: string
  salespersonUsername?: string
  commissionRatePercent?: number
  commissionAmount?: number
  items?: InvoiceItem[]
}

export interface InvoiceRequest extends Omit<Partial<Invoice>, 'id'> {
  items?: InvoiceItem[]
}

export const invoicesApi = {
  list: (status?: InvoiceStatus) =>
    axiosClient
      .get<ApiResponse<Invoice[]>>('/crm/invoices', { params: status ? { status } : {} })
      .then((r) => r.data),
  /** BE: GET /crm/invoices/{id} → { invoice, items } — flatten cho FE Invoice */
  getWithItems: (id: string) =>
    axiosClient
      .get<ApiResponse<{ invoice: Invoice; items: InvoiceItem[] } | Invoice>>(`/crm/invoices/${id}`)
      .then((r) => {
        const body = r.data as ApiResponse<{ invoice: Invoice; items: InvoiceItem[] } | Invoice>
        const payload = (body as { data?: unknown }).data ?? body
        if (payload && typeof payload === 'object' && 'invoice' in payload) {
          const nested = payload as { invoice: Invoice; items?: InvoiceItem[] }
          return {
            ...body,
            data: { ...nested.invoice, items: nested.items ?? [] },
          } as ApiResponse<Invoice>
        }
        return body as ApiResponse<Invoice>
      }),
  create: (data: InvoiceRequest) =>
    axiosClient.post<ApiResponse<Invoice>>('/crm/invoices', data).then((r) => r.data),
  update: (id: string, data: InvoiceRequest) =>
    axiosClient.put<ApiResponse<Invoice>>(`/crm/invoices/${id}`, data).then((r) => r.data),
  /** BE: PATCH /crm/invoices/{id}/issue */
  issue: (id: string) =>
    axiosClient.patch<ApiResponse<Invoice>>(`/crm/invoices/${id}/issue`).then((r) => r.data),
  /** BE: POST /crm/invoices/{id}/post-to-gl */
  postToGL: (id: string) =>
    axiosClient.post<ApiResponse<Invoice>>(`/crm/invoices/${id}/post-to-gl`).then((r) => r.data),
  /** BE: POST /crm/invoices/{id}/record-payment?amount=&paymentAccountCode= */
  recordPayment: (id: string, amount: number, paymentAccountCode?: string) =>
    axiosClient
      .post<ApiResponse<Invoice>>(`/crm/invoices/${id}/record-payment`, null, {
        params: {
          amount,
          ...(paymentAccountCode ? { paymentAccountCode } : {}),
        },
      })
      .then((r) => r.data),
}

// -------- Commissions (hoa hồng sale) --------
export interface CommissionRule {
  id: string
  salespersonUsername: string
  ratePercent: number
  active?: boolean
  note?: string
}

export interface CommissionEntry {
  id: string
  invoiceId: string
  invoiceCode?: string
  dealId?: string
  salespersonUsername: string
  baseAmount: number
  ratePercent: number
  commissionAmount: number
  itemQuantity?: number
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'VOID' | string
  accruedAt?: string
  notes?: string
}

export interface CommissionDashboard {
  totalCommission: number
  totalInvoices: number
  totalQuantity: number
  salespersonCount: number
  defaultRatePercent: number
  bySalesperson: {
    salespersonUsername: string
    invoiceCount: number
    totalCommission: number
    totalBase: number
    totalQuantity: number
  }[]
}

export const commissionsApi = {
  dashboard: () =>
    axiosClient.get<ApiResponse<CommissionDashboard>>('/crm/commissions/dashboard').then((r) => r.data.data),
  listRules: () =>
    axiosClient.get<ApiResponse<CommissionRule[]>>('/crm/commissions/rules').then((r) => r.data.data),
  upsertRule: (data: { salespersonUsername: string; ratePercent: number; active?: boolean; note?: string }) =>
    axiosClient.post<ApiResponse<CommissionRule>>('/crm/commissions/rules', data).then((r) => r.data.data),
  deleteRule: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/crm/commissions/rules/${id}`).then((r) => r.data),
  resolveRate: (salespersonUsername?: string) =>
    axiosClient
      .get<ApiResponse<{ ratePercent: number }>>('/crm/commissions/resolve-rate', {
        params: salespersonUsername ? { salespersonUsername } : {},
      })
      .then((r) => r.data.data),
  listEntries: (salespersonUsername?: string) =>
    axiosClient
      .get<ApiResponse<CommissionEntry[]>>('/crm/commissions/entries', {
        params: salespersonUsername ? { salespersonUsername } : {},
      })
      .then((r) => r.data.data),
  approve: (id: string) =>
    axiosClient.patch<ApiResponse<CommissionEntry>>(`/crm/commissions/entries/${id}/approve`).then((r) => r.data.data),
  markPaid: (id: string) =>
    axiosClient.patch<ApiResponse<CommissionEntry>>(`/crm/commissions/entries/${id}/mark-paid`).then((r) => r.data.data),
  voidEntry: (id: string) =>
    axiosClient.patch<ApiResponse<CommissionEntry>>(`/crm/commissions/entries/${id}/void`).then((r) => r.data.data),
}

