import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bankApi } from '../services/bankApi'

export function useBankStatements() {
  return useQuery({
    queryKey: ['accounting', 'bank-statements'],
    queryFn: () => bankApi.listStatements(),
  })
}

export function useImportBankStatement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bankApi.importStatement,
    onSuccess: (stmt) => {
      toast.success(
        `Import ${stmt.importedLines} dòng · đã match ${stmt.matchedCount}`,
      )
      qc.invalidateQueries({ queryKey: ['accounting', 'bank-statements'] })
    },
    onError: () => toast.error('Import sao kê thất bại'),
  })
}

export function useBankStatementLines(
  statementId?: string,
  status: 'unmatched' | 'matched' | 'all' = 'all',
) {
  return useQuery({
    queryKey: ['accounting', 'bank-lines', statementId, status],
    queryFn: () => bankApi.listLines(statementId!, status),
    enabled: !!statementId,
    select: (p) => p?.content ?? [],
  })
}

export function useBankSuggestions(
  statementId?: string,
  lineId?: string,
  mode: 'exact' | 'fuzzy' = 'fuzzy',
) {
  return useQuery({
    queryKey: ['accounting', 'bank-suggestions', statementId, lineId, mode],
    queryFn: () => bankApi.suggestions(statementId!, lineId!, mode),
    enabled: !!statementId && !!lineId,
  })
}

export function useLockBankStatement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (statementId: string) => bankApi.lock(statementId),
    onSuccess: () => {
      toast.success('Đã khoá sao kê')
      qc.invalidateQueries({ queryKey: ['accounting', 'bank-statements'] })
    },
    onError: () => toast.error('Khoá thất bại'),
  })
}

export function useReopenBankStatement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (statementId: string) => bankApi.reopen(statementId),
    onSuccess: () => {
      toast.success('Đã mở lại sao kê')
      qc.invalidateQueries({ queryKey: ['accounting', 'bank-statements'] })
    },
    onError: () => toast.error('Reopen thất bại'),
  })
}

export function useMatchBankLine(statementId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      lineId,
      journalEntryLineId,
    }: {
      lineId: string
      journalEntryLineId: string
    }) => bankApi.match(lineId, journalEntryLineId),
    onSuccess: () => {
      toast.success('Đã khớp giao dịch')
      qc.invalidateQueries({ queryKey: ['accounting', 'bank-lines', statementId] })
      qc.invalidateQueries({ queryKey: ['accounting', 'bank-statements'] })
      qc.invalidateQueries({ queryKey: ['accounting', 'bank-suggestions'] })
    },
    onError: () => toast.error('Match thất bại'),
  })
}

export function useUnmatchBankLine(statementId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lineId: string) => bankApi.unmatch(lineId),
    onSuccess: () => {
      toast.success('Đã bỏ khớp')
      qc.invalidateQueries({ queryKey: ['accounting', 'bank-lines', statementId] })
      qc.invalidateQueries({ queryKey: ['accounting', 'bank-statements'] })
    },
    onError: () => toast.error('Unmatch thất bại'),
  })
}
