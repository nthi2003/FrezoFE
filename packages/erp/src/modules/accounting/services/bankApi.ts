// ============================================================
// Bank Reconciliation API (BE FZ-001 đã ship)
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export type MatchStatus = 'UNMATCHED' | 'MATCHED' | 'SUGGESTED'
export type StatementLockStatus = 'OPEN' | 'LOCKED'

export interface BankStatementDto {
  id: string
  accountId: string
  accountCode?: string
  accountName?: string
  importedAt: string
  importedLines: number
  matchedCount: number
  unmatchedCount: number
  fileName?: string
  /** OPEN | LOCKED — disable match khi LOCKED */
  lockStatus?: StatementLockStatus | string
  lockedAt?: string
  lockedBy?: string
}

export interface BankStatementLineDto {
  id: string
  statementId: string
  txnDate: string
  description: string
  refCode?: string
  debit: number
  credit: number
  balance?: number
  matchStatus: MatchStatus
  matchedJournalLineId?: string
}

export interface MatchSuggestionDto {
  journalEntryLineId: string
  journalEntryCode?: string
  txnDate: string
  description: string
  amount: number
  score: number
  reason: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  number: number
  size: number
}

export const bankApi = {
  listStatements: () =>
    axiosClient
      .get<ApiResponse<BankStatementDto[]>>('/accounting/bank-statements')
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  importStatement: (params: {
    accountId: string
    accountCode?: string
    accountName?: string
    file: File
  }) => {
    const fd = new FormData()
    fd.append('file', params.file)
    fd.append('accountId', params.accountId)
    if (params.accountCode) fd.append('accountCode', params.accountCode)
    if (params.accountName) fd.append('accountName', params.accountName)
    return axiosClient
      .post<ApiResponse<BankStatementDto>>(
        '/accounting/bank-statements/import',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      .then((r) => r.data.data)
  },

  listLines: (
    statementId: string,
    status: 'unmatched' | 'matched' | 'all' = 'all',
  ) =>
    axiosClient
      .get<ApiResponse<PageResponse<BankStatementLineDto>>>(
        `/accounting/bank-statements/${statementId}/lines`,
        { params: { status } },
      )
      .then((r) => r.data.data),

  suggestions: (
    statementId: string,
    lineId: string,
    mode: 'exact' | 'fuzzy' = 'fuzzy',
  ) =>
    axiosClient
      .get<ApiResponse<MatchSuggestionDto[]>>(
        `/accounting/bank-statements/${statementId}/suggestions/${lineId}`,
        { params: { mode } },
      )
      .then((r) => {
        const list = r.data.data ?? []
        return [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      }),

  match: (lineId: string, journalEntryLineId: string) =>
    axiosClient
      .post<ApiResponse<BankStatementLineDto>>(
        `/accounting/bank-statements/lines/${lineId}/match`,
        { journalEntryLineId },
      )
      .then((r) => r.data.data),

  unmatch: (lineId: string) =>
    axiosClient
      .post<ApiResponse<BankStatementLineDto>>(
        `/accounting/bank-statements/lines/${lineId}/unmatch`,
      )
      .then((r) => r.data.data),

  lock: (statementId: string) =>
    axiosClient
      .post<ApiResponse<BankStatementDto>>(
        `/accounting/bank-statements/${statementId}/lock`,
      )
      .then((r) => r.data.data),

  reopen: (statementId: string) =>
    axiosClient
      .post<ApiResponse<BankStatementDto>>(
        `/accounting/bank-statements/${statementId}/reopen`,
      )
      .then((r) => r.data.data),
}

/** Parse CSV client-side — cột chuẩn: date,description,ref,debit,credit,balance */
export function parseBankCsv(text: string): Array<{
  txnDate: string
  description: string
  refCode?: string
  debit: number
  credit: number
  balance?: number
}> {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  const header = splitCsvRow(lines[0]).map((h) => h.toLowerCase().trim())
  const idx = {
    date: findCol(header, ['date', 'txndate', 'ngày', 'ngay', 'txn_date']),
    desc: findCol(header, ['description', 'desc', 'nội dung', 'noi dung', 'memo']),
    ref: findCol(header, ['ref', 'refcode', 'reference', 'mã gd', 'ma gd']),
    debit: findCol(header, ['debit', 'nợ', 'no', 'withdrawal', 'chi']),
    credit: findCol(header, ['credit', 'có', 'co', 'deposit', 'thu']),
    balance: findCol(header, ['balance', 'số dư', 'so du']),
  }

  return lines
    .slice(1)
    .map((row) => {
      const cols = splitCsvRow(row)
      return {
        txnDate: normalizeDate(cols[idx.date] || ''),
        description: cols[idx.desc] || '',
        refCode: idx.ref >= 0 ? cols[idx.ref] : undefined,
        debit: parseNum(cols[idx.debit]),
        credit: parseNum(cols[idx.credit]),
        balance: idx.balance >= 0 ? parseNum(cols[idx.balance]) : undefined,
      }
    })
    .filter((r) => r.txnDate && (r.debit > 0 || r.credit > 0 || r.description))
}

function findCol(header: string[], aliases: string[]): number {
  for (const a of aliases) {
    const i = header.findIndex((h) => h === a || h.includes(a))
    if (i >= 0) return i
  }
  return -1
}

function splitCsvRow(row: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (ch === '"') {
      inQ = !inQ
      continue
    }
    if (ch === ',' && !inQ) {
      out.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur.trim())
  return out
}

function parseNum(v?: string): number {
  if (!v) return 0
  const n = Number(String(v).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function normalizeDate(v: string): string {
  if (!v) return ''
  const m = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
  if (m) {
    return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  return v
}
