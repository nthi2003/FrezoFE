import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unwrapList, unwrapOne as unwrap } from '@frezo/utils'
import { toast } from '@/lib/toast'
import {
  accountsApi, periodsApi, journalsApi, glApi, settingApi, payrollGlApi,
  type AccountingStandard, type JournalEntryPayload, type PostingSource,
  type AccountingSettingPayload,
} from '../services/accountingApi'

// ---------- Accounts ----------

export function useAccounts(standard?: AccountingStandard) {
  return useQuery({
    queryKey: ['accounting', 'accounts', standard ?? 'all'],
    queryFn: () => accountsApi.list(standard),
    select: unwrapList,
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      toast.success('Đã thêm tài khoản')
      qc.invalidateQueries({ queryKey: ['accounting', 'accounts'] })
    },
    onError: (err) => toast.apiError(err, 'Không thể thêm tài khoản'),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => accountsApi.update(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật')
      qc.invalidateQueries({ queryKey: ['accounting', 'accounts'] })
    },
    onError: (err) => toast.apiError(err, 'Không thể cập nhật tài khoản'),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa')
      qc.invalidateQueries({ queryKey: ['accounting', 'accounts'] })
    },
    onError: () => toast.error('Không thể xóa'),
  })
}

export function useSeedCoa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (standard: AccountingStandard) => accountsApi.seed(standard),
    onSuccess: (res: any) => {
      const n = res?.data?.created ?? 0
      toast.success(`Đã seed ${n} tài khoản`)
      qc.invalidateQueries({ queryKey: ['accounting', 'accounts'] })
    },
    onError: () => toast.error('Seed COA thất bại'),
  })
}

// ---------- Periods ----------

export function usePeriods(year?: number) {
  return useQuery({
    queryKey: ['accounting', 'periods', year ?? 'current'],
    queryFn: () => periodsApi.list(year),
    select: unwrapList,
  })
}

export function useEnsureYear() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (year: number) => periodsApi.ensure(year),
    onSuccess: () => {
      toast.success('Đã tạo/năm tài chính + 12 kỳ')
      qc.invalidateQueries({ queryKey: ['accounting', 'periods'] })
    },
  })
}

export function useClosePeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => periodsApi.close(id),
    onSuccess: () => {
      toast.success('Đã khóa kỳ')
      qc.invalidateQueries({ queryKey: ['accounting', 'periods'] })
    },
    onError: () => toast.error('Không thể khóa kỳ'),
  })
}

export function useReopenPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => periodsApi.reopen(id),
    onSuccess: () => {
      toast.success('Đã mở lại kỳ')
      qc.invalidateQueries({ queryKey: ['accounting', 'periods'] })
    },
    onError: () => toast.error('Không thể mở lại kỳ'),
  })
}

// ---------- Journals ----------

export function useJournalsByPeriod(periodId?: string) {
  return useQuery({
    queryKey: ['accounting', 'journals', 'period', periodId],
    queryFn: () => journalsApi.listByPeriod(periodId!),
    select: unwrapList,
    enabled: !!periodId,
  })
}

export function useJournalsBySource(source: PostingSource, sourceId?: string) {
  return useQuery({
    queryKey: ['accounting', 'journals', 'source', source, sourceId],
    queryFn: () => journalsApi.listBySource(source, sourceId!),
    select: unwrapList,
    enabled: !!sourceId,
  })
}

export function useJournalDetail(id?: string) {
  return useQuery({
    queryKey: ['accounting', 'journals', id],
    queryFn: () => journalsApi.get(id!),
    select: unwrap,
    enabled: !!id,
  })
}

export function useCreateJournalPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: JournalEntryPayload) => journalsApi.createAndPost(data),
    onSuccess: () => {
      toast.success('Đã tạo & ghi sổ chứng từ')
      qc.invalidateQueries({ queryKey: ['accounting'] })
    },
    onError: () => toast.error('Không thể ghi sổ — kiểm tra cân đối Nợ = Có'),
  })
}

export function usePostJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => journalsApi.post(id),
    onSuccess: () => {
      toast.success('Đã ghi sổ chứng từ')
      qc.invalidateQueries({ queryKey: ['accounting'] })
    },
    onError: () => toast.error('Không thể ghi sổ chứng từ'),
  })
}

export function useReverseJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => journalsApi.reverse(id, reason),
    onSuccess: () => {
      toast.success('Đã đảo chứng từ')
      qc.invalidateQueries({ queryKey: ['accounting'] })
    },
    onError: () => toast.error('Không thể đảo'),
  })
}

// ---------- GL ----------

export function useGeneralLedger(accountCode?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['accounting', 'gl', accountCode, from, to],
    queryFn: () => glApi.ledger(accountCode!, from!, to!),
    select: unwrap,
    enabled: !!accountCode && !!from && !!to,
  })
}

export function useTrialBalance(from?: string, to?: string) {
  return useQuery({
    queryKey: ['accounting', 'trial-balance', from, to],
    queryFn: () => glApi.trialBalance(from!, to!),
    select: unwrapList,
    enabled: !!from && !!to,
  })
}

// ---------- Setting ----------

export function useAccountingSetting() {
  return useQuery({
    queryKey: ['accounting', 'setting'],
    queryFn: () => settingApi.get(),
    select: unwrap,
  })
}

export function useUpdateSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AccountingSettingPayload) => settingApi.update(data),
    onSuccess: () => {
      toast.success('Đã lưu cấu hình')
      qc.invalidateQueries({ queryKey: ['accounting', 'setting'] })
      qc.invalidateQueries({ queryKey: ['accounting', 'accounts'] })
    },
  })
}

// ---------- Payroll → GL ----------

export function usePostPayrollToGL() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      payrollGlApi.postPeriod(year, month),
    onSuccess: () => {
      toast.success('Đã hạch toán bảng lương sang sổ cái')
      qc.invalidateQueries({ queryKey: ['accounting'] })
    },
    onError: () => toast.error('Không thể hạch toán — kiểm tra có bảng lương trong kỳ chưa'),
  })
}
