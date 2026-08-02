// ============================================================
// BankStatementImportPage — wizard 3 bước (FZ-001 / FE-4)
// 1. Chọn TK 112x + upload CSV
// 2. Xem trước + map cột (auto-detect)
// 3. Xác nhận import
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ChevronRight, ChevronLeft, Check, Landmark, HelpCircle } from 'lucide-react'
import { Button, PageHeader, Select } from '@frezo/ui'
import { formatCurrency } from '@frezo/utils'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { useAccounts } from '../hooks/useAccounting'
import { useImportBankStatement } from '../hooks/useBankStatement'
import { parseBankCsv } from '../services/bankApi'
import type { Account } from '../services/accountingApi'

type Step = 1 | 2 | 3

interface PreviewLine {
  txnDate: string
  description: string
  refCode?: string
  debit: number
  credit: number
  balance?: number
}

export function BankStatementImportPage() {
  const nav = useNavigate()
  const { data: accounts } = useAccounts()
  const importMut = useImportBankStatement()

  const bankAccounts = useMemo(() => {
    const list = (accounts as Account[] | undefined) ?? []
    const filtered = list.filter((a) => String(a.code || '').startsWith('112'))
    return filtered.length > 0 ? filtered : list.slice(0, 8)
  }, [accounts])

  const [step, setStep] = useState<Step>(1)
  const [accountId, setAccountId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewLine[]>([])
  const [parseError, setParseError] = useState('')

  const selected = bankAccounts.find((a) => a.id === accountId)

  const onFile = async (f: File) => {
    setFile(f)
    setParseError('')
    try {
      const text = await f.text()
      const rows = parseBankCsv(text)
      if (rows.length === 0) {
        setParseError('Không đọc được dòng nào — kiểm tra header CSV.')
        setPreview([])
        return
      }
      setPreview(rows)
    } catch {
      setParseError('Đọc file thất bại')
      setPreview([])
    }
  }

  const canNext1 = !!accountId && !!file && preview.length > 0
  const canConfirm = canNext1

  const onConfirm = () => {
    if (!file || !accountId) return
    importMut.mutate(
      {
        accountId,
        accountCode: selected?.code,
        accountName: selected?.name,
        file,
      },
      {
        onSuccess: (stmt) => {
          nav(`/accounting/bank-reconciliation?statementId=${stmt.id}`)
        },
      },
    )
  }

  const previewColumns: AppTableColumn<PreviewLine>[] = [
    {
      key: 'txnDate',
      title: 'Ngày',
      width: 100,
      render: (_, r) => <span className="font-mono text-xs">{r.txnDate}</span>,
    },
    {
      key: 'description',
      title: 'Mô tả',
      render: (_, r) => (
        <span className="line-clamp-2">{r.description || '—'}</span>
      ),
    },
    {
      key: 'refCode',
      title: 'Tham chiếu',
      width: 88,
      render: (_, r) => (
        <span className="font-mono text-neutral-500 text-xs">{r.refCode || '—'}</span>
      ),
    },
    {
      key: 'debit',
      title: 'Nợ',
      align: 'right',
      width: 96,
      render: (_, r) => (
        <span className="tabular-nums font-mono text-xs">
          {r.debit ? formatCurrency(r.debit) : '—'}
        </span>
      ),
    },
    {
      key: 'credit',
      title: 'Có',
      align: 'right',
      width: 96,
      render: (_, r) => (
        <span className="tabular-nums font-mono text-xs text-emerald-700">
          {r.credit ? formatCurrency(r.credit) : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in max-w-4xl">
      <PageHeader
        title="Import sao kê ngân hàng"
        description="Quy trình 3 bước — CSV, khớp theo số tiền và ngày giao dịch."
        actions={(
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center text-neutral-400 hover:text-primary-600 cursor-help"
              title="Import CSV sao kê ngân hàng vào TK 112x để đối chiếu với sổ cái."
              aria-label="Giải thích import sao kê"
            >
              <HelpCircle size={16} strokeWidth={2} />
            </span>
            <Button variant="outline" size="sm" className="h-9" onClick={() => nav('/accounting/bank-reconciliation')}>
              Quay lại
            </Button>
          </div>
        )}
      />

      <StepBar step={step} />

      {step === 1 && (
        <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
          <Field label="Tài khoản ngân hàng (112x) *">
            <Select
              options={[
                { value: '', label: '— Chọn TK —' },
                ...bankAccounts.map((a) => ({
                  value: a.id,
                  label: `${a.code} · ${a.name}`,
                })),
              ]}
              value={accountId}
              onChange={setAccountId}
              placeholder="— Chọn TK —"
              aria-label="Tài khoản ngân hàng"
            />
          </Field>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-200 rounded-xl p-10 cursor-pointer hover:border-primary-300 hover:bg-primary-50/20">
            <Upload size={28} className="text-neutral-400" />
            <span className="text-sm text-neutral-600">
              {file ? file.name : 'Tải lên file CSV sao kê'}
            </span>
            <span className="text-[11px] text-neutral-400">
              Header gợi ý: date, description, ref, debit, credit, balance
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onFile(f)
              }}
            />
          </label>
          {parseError && (
            <p className="text-sm text-rose-600">{parseError}</p>
          )}
          <div className="flex justify-end">
            <Button disabled={!canNext1} onClick={() => setStep(2)} className="gap-1.5">
              Tiếp <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white border rounded-xl p-5 space-y-3 shadow-sm">
          <p className="text-sm text-neutral-600">
            Xem trước <b>{preview.length}</b> dòng · TK{' '}
            <b>
              {selected?.code} {selected?.name}
            </b>
          </p>
          <AppTable
            columns={previewColumns}
            data={preview}
            density="compact"
            showSearch={false}
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
          />
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
              <ChevronLeft size={14} /> Quay lại
            </Button>
            <Button onClick={() => setStep(3)} className="gap-1.5">
              Tiếp <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3 p-4 bg-primary-50/50 border border-primary-100 rounded-xl">
            <Landmark size={20} className="text-primary-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-neutral-900">Xác nhận import</div>
              <ul className="mt-1 text-neutral-600 space-y-0.5 list-disc pl-4">
                <li>
                  Tài khoản: {selected?.code} · {selected?.name}
                </li>
                <li>File: {file?.name}</li>
                <li>Số dòng: {preview.length}</li>
                <li>Khớp tự động: cùng số tiền và ngày (MVP)</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
              <ChevronLeft size={14} /> Quay lại
            </Button>
            <Button
              className="gap-1.5"
              disabled={!canConfirm || importMut.isPending}
              onClick={onConfirm}
            >
              <Check size={14} />
              {importMut.isPending ? 'Đang import…' : 'Import ngay'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepBar({ step }: { step: Step }) {
  const items = [
    { n: 1 as const, label: 'Chọn TK + Tải lên' },
    { n: 2 as const, label: 'Xem trước' },
    { n: 3 as const, label: 'Xác nhận' },
  ]
  return (
    <div className="flex items-center gap-2">
      {items.map((it, i) => (
        <div key={it.n} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
              step >= it.n
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-400'
            }`}
          >
            {it.n}
          </div>
          <span
            className={`text-xs font-medium hidden sm:inline ${
              step >= it.n ? 'text-neutral-800' : 'text-neutral-400'
            }`}
          >
            {it.label}
          </span>
          {i < items.length - 1 && (
            <ChevronRight size={14} className="text-neutral-300 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-neutral-700 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
