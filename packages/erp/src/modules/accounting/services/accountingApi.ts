import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

// ------------------------ Chart of Accounts ------------------------

export type AccountingStandard = 'TT133' | 'TT99'
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'CLEARING'

export interface Account {
  id: string
  code: string
  name: string
  type: AccountType
  standard: AccountingStandard
  level: number
  parentId?: string | null
  postable: boolean
  requiresPartner: boolean
  openingBalance?: number
  active: boolean
  description?: string
}

export const accountsApi = {
  list: (standard?: AccountingStandard) =>
    axiosClient
      .get<ApiResponse<Account[]>>('/accounting/accounts', { params: standard ? { standard } : {} })
      .then((r) => r.data),
  get: (id: string) =>
    axiosClient.get<ApiResponse<Account>>(`/accounting/accounts/${id}`).then((r) => r.data),
  create: (data: Partial<Account>) =>
    axiosClient.post<ApiResponse<Account>>('/accounting/accounts', data).then((r) => r.data),
  update: (id: string, data: Partial<Account>) =>
    axiosClient.put<ApiResponse<Account>>(`/accounting/accounts/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<void>>(`/accounting/accounts/${id}`).then((r) => r.data),
  seed: (standard: AccountingStandard) =>
    axiosClient
      .post<ApiResponse<{ created: number }>>('/accounting/accounts/seed', null, { params: { standard } })
      .then((r) => r.data),
}

// ------------------------ Fiscal Period ------------------------

export type PeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED'

export interface FiscalPeriod {
  id: string
  fiscalYearId: string
  month: number
  year: number
  startDate: string
  endDate: string
  status: PeriodStatus
  closedAt?: string
  closedBy?: string
}

export const periodsApi = {
  list: (year?: number) =>
    axiosClient
      .get<ApiResponse<FiscalPeriod[]>>('/accounting/periods', { params: year ? { year } : {} })
      .then((r) => r.data),
  ensure: (year: number) =>
    axiosClient
      .post<ApiResponse<FiscalPeriod>>('/accounting/periods/ensure', null, { params: { year } })
      .then((r) => r.data),
  close: (id: string) =>
    axiosClient.post<ApiResponse<FiscalPeriod>>(`/accounting/periods/${id}/close`).then((r) => r.data),
  reopen: (id: string) =>
    axiosClient.post<ApiResponse<FiscalPeriod>>(`/accounting/periods/${id}/reopen`).then((r) => r.data),
}

// ------------------------ Journals ------------------------

export type JournalStatus = 'DRAFT' | 'POSTED' | 'REVERSED'
export type PostingSource =
  | 'MANUAL' | 'PAYROLL' | 'SALES_INVOICE' | 'PURCHASE'
  | 'DEPRECIATION' | 'REVERSAL' | 'CASH_BANK' | 'INVENTORY'

export interface JournalLine {
  id?: string
  lineNo?: number
  accountId?: string
  accountCode: string
  accountName?: string
  debit: number
  credit: number
  description?: string
  departmentId?: string
  partnerType?: string
  partnerId?: string
  partnerName?: string
  projectId?: string
}

export interface JournalEntry {
  id: string
  code: string
  postingDate: string
  documentDate?: string
  periodId: string
  description: string
  sourceType: PostingSource
  sourceId?: string
  idempotencyKey?: string
  status: JournalStatus
  totalDebit: number
  totalCredit: number
  postedAt?: string
  postedBy?: string
  reversalOfId?: string
  lines: JournalLine[]
}

export interface JournalEntryPayload {
  postingDate: string
  documentDate?: string
  description: string
  sourceType?: PostingSource
  sourceId?: string
  idempotencyKey?: string
  lines: JournalLine[]
}

export const journalsApi = {
  get: (id: string) =>
    axiosClient.get<ApiResponse<JournalEntry>>(`/accounting/journals/${id}`).then((r) => r.data),
  listByPeriod: (periodId: string) =>
    axiosClient
      .get<ApiResponse<JournalEntry[]>>('/accounting/journals', { params: { periodId } })
      .then((r) => r.data),
  listBySource: (source: PostingSource, sourceId: string) =>
    axiosClient
      .get<ApiResponse<JournalEntry[]>>('/accounting/journals', { params: { source, sourceId } })
      .then((r) => r.data),
  createDraft: (data: JournalEntryPayload) =>
    axiosClient.post<ApiResponse<JournalEntry>>('/accounting/journals/draft', data).then((r) => r.data),
  createAndPost: (data: JournalEntryPayload) =>
    axiosClient.post<ApiResponse<JournalEntry>>('/accounting/journals/post', data).then((r) => r.data),
  post: (id: string) =>
    axiosClient.post<ApiResponse<JournalEntry>>(`/accounting/journals/${id}/post`).then((r) => r.data),
  reverse: (id: string, reason?: string) =>
    axiosClient
      .post<ApiResponse<JournalEntry>>(`/accounting/journals/${id}/reverse`, null, {
        params: reason ? { reason } : {},
      })
      .then((r) => r.data),
}

// ------------------------ GL & Trial Balance ------------------------

export interface GLLine {
  journalEntryId: string
  journalCode?: string
  postingDate?: string
  description?: string
  debit: number
  credit: number
  runningDebit?: number
  runningCredit?: number
  partnerName?: string
  departmentId?: string
}

export interface GLResponse {
  accountId: string
  accountCode: string
  accountName: string
  from: string
  to: string
  openingDebit: number
  openingCredit: number
  periodDebit: number
  periodCredit: number
  closingDebit: number
  closingCredit: number
  lines: GLLine[]
}

export interface TrialBalanceRow {
  accountId: string
  accountCode: string
  accountName: string
  openingDebit: number
  openingCredit: number
  periodDebit: number
  periodCredit: number
  closingDebit: number
  closingCredit: number
}

export const glApi = {
  ledger: (accountCode: string, from: string, to: string) =>
    axiosClient
      .get<ApiResponse<GLResponse>>('/accounting/gl/ledger', { params: { accountCode, from, to } })
      .then((r) => r.data),
  trialBalance: (from: string, to: string) =>
    axiosClient
      .get<ApiResponse<TrialBalanceRow[]>>('/accounting/gl/trial-balance', { params: { from, to } })
      .then((r) => r.data),
}

// ------------------------ Setting ------------------------

export interface AccountingSetting {
  id?: string
  standard: AccountingStandard
  baseCurrency: string
  payrollPostingStrategy: string
  accSalaryExpense?: string
  accSalaryPayable?: string
  accBhxhPayable?: string
  accBhytPayable?: string
  accBhtnPayable?: string
  accPitPayable?: string
  accUnionFee?: string
}

export interface AccountingSettingPayload extends AccountingSetting {
  seedCoa?: boolean
}

export const settingApi = {
  get: () =>
    axiosClient.get<ApiResponse<AccountingSetting>>('/accounting/setting').then((r) => r.data),
  update: (data: AccountingSettingPayload) =>
    axiosClient.put<ApiResponse<AccountingSetting>>('/accounting/setting', data).then((r) => r.data),
}

// ------------------------ Payroll → GL bridge ------------------------

export const payrollGlApi = {
  postPeriod: (year: number, month: number) =>
    axiosClient
      .post<ApiResponse<{ journalEntryId: string }>>(`/qlns/payslip/period/${year}/${month}/post-to-gl`)
      .then((r) => r.data),
  reversePeriod: (year: number, month: number, reason?: string) =>
    axiosClient
      .post<ApiResponse<{ reversalJournalId: string }>>(
        `/qlns/payslip/period/${year}/${month}/reverse-gl`,
        null,
        { params: reason ? { reason } : {} },
      )
      .then((r) => r.data),
}

// -------- Payslip mobile-focused API (dùng chung cho FE Payroll page nếu cần) --------

export interface PayslipFullResponse {
  payrollId: string
  personId: string
  personName?: string
  month: number
  year: number
  status?: string
  netSalary: number
  earnings: {
    base: number; overtime: number; overtimeNormal?: number;
    overtimeWeekend?: number; overtimeHoliday?: number;
    allowance: number; bonus: number; gross: number
  }
  deductions: {
    socialInsurance: number; healthInsurance: number; unemploymentInsurance: number;
    personalIncomeTax: number; unionFee?: number; latePenalty?: number;
    advance?: number; other?: number; total: number
  }
  attendance?: {
    standardDays: number; actualDays: number; leavesPaid: number;
    leavesUnpaid: number; lateMinutes: number
  }
  confirmation?: { confirmed: boolean; confirmedAt?: string; note?: string }
}

export const payslipApi = {
  full: (payrollId: string) =>
    axiosClient
      .get<ApiResponse<PayslipFullResponse>>(`/qlns/payslip/${payrollId}`)
      .then((r) => r.data),
  ytd: (personId: string, year: number) =>
    axiosClient
      .get<ApiResponse<any>>('/qlns/payslip/ytd', { params: { personId, year } })
      .then((r) => r.data),
  formulas: () =>
    axiosClient.get<ApiResponse<any>>('/qlns/payslip/formulas').then((r) => r.data),
}
